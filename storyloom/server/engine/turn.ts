import {
  setWitnesses, deleteMemory, deleteMessage, getSetting, getSnapshot, insertMemory, insertMessage, newId, saveSnapshot,
  updateMessage, updateSession, type MessageRow,
} from "../db.ts";
import { estimateCost, getModelSettings, getProvider, type Effort, type LLMUsage } from "../llm/provider.ts";
import { loadWorld, perceivedOf, relevantMemories, transcriptFor, type World } from "./context.ts";
import {
  characterPrompt, chroniclerPrompt, chroniclerSchema, directorPrompt, directorSchema, narratorPrompt,
  summarizerSchema, SUMMARIZER_RULES, worldBlock, type ResponseLength,
} from "./prompts.ts";
import { findMentions, heuristicInterpret, needsInterpretation, stripMentionMarks } from "./roleplay-format.ts";
import { emptyCharacterState, type Beat, type ClassifiedSegment, type Interpretation, type SessionState } from "./types.ts";

export type TurnEvent =
  | { type: "status"; text: string }
  | { type: "user_message"; message: MessageRow }
  | { type: "message_updated"; message: MessageRow }
  | { type: "removed"; ids: string[] }
  | { type: "beat_start"; key: string; speaker: string }
  | { type: "delta"; key: string; text: string }
  | { type: "beat_end"; key: string; message: MessageRow | null }
  | { type: "notice"; text: string }
  | { type: "error"; text: string }
  | { type: "done" };

export interface TurnOptions {
  sessionId: string;
  action: "send" | "continue" | "regenerate";
  text?: string;
  /** manual mode: ids chosen by the user */
  speakers?: string[];
  signal?: AbortSignal;
  emit: (e: TurnEvent) => void;
}

// One turn at a time per session; background bookkeeping (chronicler) holds the lock too.
const locks = new Map<string, Promise<unknown>>();
export async function withSessionLock<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(sessionId) ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((r) => (release = r));
  const chain = prev.then(() => mine);
  locks.set(sessionId, chain);
  await prev.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(sessionId) === chain) locks.delete(sessionId);
  }
}
/** Resolves when any pending background work for this session is finished (used by tests). */
export function idle(sessionId: string): Promise<unknown> {
  return locks.get(sessionId) ?? Promise.resolve();
}

function responseLength(): ResponseLength {
  const v = getSetting("response_length");
  return v === "short" || v === "long" ? v : "medium";
}

function addUsage(sessionId: string, current: World["session"]["usage"], u: LLMUsage) {
  const next = {
    input_tokens: (current.input_tokens ?? 0) + u.input_tokens + u.cache_write_tokens,
    output_tokens: (current.output_tokens ?? 0) + u.output_tokens,
    cache_read_tokens: (current.cache_read_tokens ?? 0) + u.cache_read_tokens,
    cost_usd: (current.cost_usd ?? 0) + estimateCost(u),
    calls: (current.calls ?? 0) + 1,
  };
  Object.assign(current, next);
  updateSession(sessionId, { usage: next });
}

const SILENT = /^\s*\[?\s*silent\s*\]?\s*\.?\s*$/i;

/** Remove things an actor sometimes adds by mistake: a "Name:" prefix, wrapping quotes on the whole reply. */
export function cleanBeatText(text: string, name: string): string {
  let t = text.trim();
  const prefix = new RegExp(`^\\**${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\**\\s*:\\s*`, "i");
  t = t.replace(prefix, "");
  return t.trim();
}

export async function runTurn(opts: TurnOptions): Promise<void> {
  const { sessionId, emit, signal } = opts;
  const provider = getProvider(); // throws a friendly error early if no API key
  await withSessionLock(sessionId, async () => {
    let w = loadWorld(sessionId);
    const settings = getModelSettings();
    const advanced = w.session.intelligence === "advanced";
    const manual = w.session.speaker_mode === "manual" && (opts.speakers?.length ?? 0) > 0;
    const transcriptLimit = advanced ? 60 : 36;

    // ---- 1. figure out the turn and the user's message ----
    let turnId: string;
    let userMsg: MessageRow | null = null;

    if (opts.action === "regenerate") {
      const last = w.messages[w.messages.length - 1];
      if (!last || !last.turn_id) throw new Error("Nothing to regenerate yet.");
      turnId = last.turn_id;
      const snap = getSnapshot(sessionId, turnId);
      const turnMsgs = w.messages.filter((m) => m.turn_id === turnId);
      userMsg = turnMsgs.find((m) => m.kind === "user") ?? null;
      const removed = turnMsgs.filter((m) => m.kind !== "user");
      removed.forEach((m) => deleteMessage(m.id));
      w.memories.filter((m) => m.turn_id === turnId).forEach((m) => deleteMemory(m.id));
      if (snap) updateSession(sessionId, { state: snap.state, summary: snap.summary, summarized_upto: snap.summarized_upto });
      if (removed.length) emit({ type: "removed", ids: removed.map((m) => m.id) });
      w = loadWorld(sessionId);
    } else {
      turnId = newId("t_");
      saveSnapshot(sessionId, turnId);
      if (opts.action === "send") {
        const text = (opts.text ?? "").trim();
        if (!text) throw new Error("Message is empty.");
        const h = heuristicInterpret(text, w.userName, w.cast);
        userMsg = insertMessage({
          session_id: sessionId, kind: "user", character_id: null, content: text,
          perceived: h.perceived, private_note: h.private_note || null,
          witnesses: [...w.session.state.scene.present], turn_id: turnId,
        });
        emit({ type: "user_message", message: userMsg });
        w = loadWorld(sessionId);
      }
    }

    // ---- 2. director: interpret + choose beats ----
    const presentIds = w.session.state.scene.present.filter((id) => w.castMap.has(id));
    const userText = userMsg?.content ?? null;
    const heur = userText ? heuristicInterpret(userText, w.userName, w.cast) : null;
    const addressed = userText ? findMentions(userText, w.cast) : [];
    let interp: Interpretation | null = heur;
    let beats: Beat[] = [];
    const manualIds = manual ? opts.speakers!.filter((id) => w.castMap.has(id)) : null;

    const directorNeeded = !manual || (userText !== null && needsInterpretation(userText));
    if (directorNeeded && w.cast.length > 0) {
      emit({ type: "status", text: manual ? "Reading your message…" : "Deciding who responds…" });
      try {
        const p = directorPrompt({
          plot: w.plot, persona: w.persona, state: w.session.state, cast: w.cast,
          transcript: transcriptFor({ ...w, messages: w.messages.filter((m) => m.id !== userMsg?.id) }, null, transcriptLimit),
          summary: w.session.summary, userText,
          heuristicHint: heur ? JSON.stringify(heur.segments.map((s) => ({ text: s.text, type: s.type, observable: s.observable }))) : "",
          manualSpeakers: manualIds, addressedHint: addressed,
        });
        const { data, usage } = await provider.json<DirectorOutput>({
          model: settings.helperModel, system: { stable: p.stable, volatile: p.volatile }, user: p.user,
          effort: advanced ? "medium" : "low", maxTokens: advanced ? 16000 : 8000, signal,
          schema: directorSchema(w.cast.map((c) => c.id)),
        });
        addUsage(sessionId, w.session.usage, usage);
        if (userText) interp = sanitizeInterpretation(data, heur!, w);
        beats = sanitizeBeats(data.beats, w, presentIds);
      } catch (e) {
        if (signal?.aborted) return finish();
        emit({ type: "notice", text: `The director step failed (${errMsg(e)}); using a simpler fallback for this turn.` });
        beats = fallbackBeats(w, presentIds, addressed);
      }
    }
    if (manualIds) {
      // Respect the user's choice exactly; keep the director's direction for them if it gave one.
      beats = manualIds.map((id) => beats.find((b) => b.speaker === id) ?? { speaker: id, direction: "", enters: !presentIds.includes(id), complex: false });
    } else if (!directorNeeded) {
      beats = fallbackBeats(w, presentIds, addressed);
    }

    if (userMsg && interp) {
      updateMessage(userMsg.id, { perceived: interp.perceived, private_note: interp.private_note || null });
      userMsg = { ...userMsg, perceived: interp.perceived, private_note: interp.private_note || null };
      emit({ type: "message_updated", message: userMsg });
    }

    // ---- 3. play each beat, each by its own actor ----
    const produced: MessageRow[] = [];
    const length = responseLength();
    for (const beat of beats) {
      if (signal?.aborted) break;
      w = loadWorld(sessionId);
      const state = w.session.state;
      const isNarrator = beat.speaker === "narrator";
      const character = isNarrator ? null : w.castMap.get(beat.speaker);
      if (!isNarrator && !character) continue;
      if (character && !state.scene.present.includes(character.id)) {
        if (!beat.enters) continue;
        state.scene.present = [...state.scene.present, character.id];
        updateSession(sessionId, { state });
        // Someone arriving now catches the moment that brought them in (e.g. a shout), nothing earlier.
        if (userMsg && !userMsg.witnesses.includes(character.id)) {
          userMsg = { ...userMsg, witnesses: [...userMsg.witnesses, character.id] };
          setWitnesses(userMsg.id, userMsg.witnesses);
          w = loadWorld(sessionId);
        }
      }
      const key = newId("b_");
      emit({ type: "beat_start", key, speaker: beat.speaker });
      let effort: Effort = advanced ? (beat.complex ? "xhigh" : "medium") : (beat.complex ? "medium" : "low");
      if (isNarrator) effort = advanced ? "medium" : "low";
      const p = isNarrator
        ? narratorPrompt({ plot: w.plot, persona: w.persona, state, cast: w.castMap, transcript: transcriptFor(w, null, transcriptLimit), beat, summary: w.session.summary })
        : characterPrompt({
          plot: w.plot, character: character!, persona: w.persona, others: w.cast.filter((c) => c.id !== character!.id),
          state, cast: w.castMap, memories: relevantMemories(w, character!.id, advanced ? 20 : 12).map((m) => m.content),
          transcript: transcriptFor(w, character!.id, transcriptLimit), beat, length, advanced,
        });
      let text = "";
      let aborted = false;
      try {
        const res = await provider.streamText(
          { model: settings.storyModel, system: { stable: p.stable, volatile: p.volatile }, user: p.user, effort, maxTokens: advanced ? 32000 : 16000, signal },
          (chunk) => {
            text += chunk;
            emit({ type: "delta", key, text: chunk });
          },
        );
        addUsage(sessionId, w.session.usage, res.usage);
        text = res.text || text;
        if (res.refused) emit({ type: "notice", text: `The model declined to write this turn for ${character?.name ?? "the narrator"}.` });
      } catch (e) {
        if (signal?.aborted) aborted = true;
        else {
          emit({ type: "error", text: `${character?.name ?? "Narrator"}: ${errMsg(e)}` });
          emit({ type: "beat_end", key, message: null });
          break;
        }
      }
      const cleaned = character ? cleanBeatText(text, character.name) : text.trim();
      if (!cleaned || SILENT.test(cleaned)) {
        emit({ type: "beat_end", key, message: null });
        if (aborted) break;
        continue;
      }
      const msg = insertMessage({
        session_id: sessionId, kind: isNarrator ? "narration" : "character", character_id: character?.id ?? null,
        content: cleaned, perceived: null, private_note: null, witnesses: [...loadWorld(sessionId).session.state.scene.present], turn_id: turnId,
      });
      produced.push(msg);
      emit({ type: "beat_end", key, message: msg });
      if (aborted) break;
    }
    if (beats.length === 0 || (produced.length === 0 && !signal?.aborted)) {
      emit({ type: "notice", text: "No one responds right now. You can write more, use Continue, or pick a speaker manually." });
    }
    finish();

    // ---- 4. bookkeeping in the background (still under the session lock) ----
    if (userMsg || produced.length) {
      try {
        await chronicle(sessionId, turnId, userMsg, produced, advanced);
        await maybeSummarize(sessionId, advanced);
      } catch (e) {
        console.error("[chronicle]", errMsg(e));
      }
    }
  });

  function finish() {
    emit({ type: "done" });
  }
}

interface DirectorOutput {
  segments: ClassifiedSegment[];
  perceived: string;
  private_note: string;
  addressed: string[];
  beats: Beat[];
}

function sanitizeInterpretation(d: DirectorOutput, heur: Interpretation, w: World): Interpretation {
  const perceived = typeof d.perceived === "string" ? stripMentionMarks(d.perceived.trim()) : heur.perceived;
  // Safety net: if any sentence the rule-based parser is confident is private appears verbatim in
  // the "perceived" text, fall back to the rule-based rendering.
  const leaked = heur.segments.some((s) => !s.observable && s.text.length > 12 && perceived.toLowerCase().includes(s.text.toLowerCase().replace(/[.!?]$/, "")));
  return {
    segments: Array.isArray(d.segments) ? d.segments : heur.segments,
    perceived: leaked || !perceived ? heur.perceived : perceived,
    private_note: (d.private_note ?? "").trim() || heur.private_note,
    addressed: (d.addressed ?? []).filter((id) => w.castMap.has(id)),
  };
}

function sanitizeBeats(raw: Beat[], w: World, present: string[]): Beat[] {
  const out: Beat[] = [];
  for (const b of raw ?? []) {
    if (out.length >= 5) break;
    if (b.speaker !== "narrator" && !w.castMap.has(b.speaker)) continue;
    if (b.speaker !== "narrator" && !present.includes(b.speaker) && !b.enters) continue;
    out.push({ speaker: b.speaker, direction: String(b.direction ?? "").slice(0, 400), enters: !!b.enters, complex: !!b.complex });
  }
  return out;
}

function fallbackBeats(w: World, present: string[], addressed: string[]): Beat[] {
  const target = addressed.find((id) => present.includes(id)) ?? present[0];
  return target ? [{ speaker: target, direction: "", enters: false, complex: false }] : [{ speaker: "narrator", direction: "", enters: false, complex: false }];
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ---------------------------------------------------------------------------
// Chronicler
// ---------------------------------------------------------------------------

interface ChroniclerOutput {
  scene: { location: string; time: string; description: string; present: string[] };
  characters: { id: string; mood: string; goals: string[]; plans: string[]; intentions: string; beliefs: string[]; trust_user: number; affection_user: number; user_view: string; relationships: { id: string; note: string }[] }[];
  memories: { content: string; importance: number; known_by: string[]; kind: string }[];
  threads: string[];
}

export function turnTranscript(w: World, userMsg: MessageRow | null, produced: MessageRow[]): string {
  const lines: string[] = [];
  if (userMsg) {
    const present = userMsg.witnesses.map((id) => w.castMap.get(id)?.name).filter(Boolean).join(", ") || "nobody";
    lines.push(`${w.userName} (present: ${present}) — visible/audible: ${perceivedOf(userMsg, w.userName) || "(nothing)"}`);
    if (userMsg.private_note) lines.push(`PRIVATE (inside ${w.userName}'s head; no character knows this): ${userMsg.private_note}`);
  }
  for (const m of produced) {
    const who = m.kind === "narration" ? "Narration" : w.castMap.get(m.character_id ?? "")?.name ?? "Someone";
    const witnesses = m.witnesses.map((id) => w.castMap.get(id)?.name).filter(Boolean).join(", ");
    lines.push(`${who} (witnessed by: ${w.userName}${witnesses ? ", " + witnesses : ""}): ${m.content}`);
  }
  return lines.join("\n\n");
}

export function applyChronicle(prev: SessionState, d: ChroniclerOutput, castIds: Set<string>): SessionState {
  const next: SessionState = structuredClone(prev);
  if (d.scene) {
    next.scene = {
      location: d.scene.location || prev.scene.location,
      time: d.scene.time || prev.scene.time,
      description: d.scene.description || prev.scene.description,
      present: Array.isArray(d.scene.present) ? [...new Set(d.scene.present.filter((id) => castIds.has(id)))] : prev.scene.present,
    };
  }
  for (const c of d.characters ?? []) {
    if (!castIds.has(c.id)) continue;
    const old = next.characters[c.id] ?? emptyCharacterState();
    const clamp = (oldV: number, v: number) => {
      const target = Number.isFinite(v) ? Math.round(v) : oldV;
      return Math.max(-10, Math.min(10, Math.max(oldV - 3, Math.min(oldV + 3, target))));
    };
    next.characters[c.id] = {
      ...old,
      mood: c.mood ?? old.mood,
      goals: (c.goals ?? old.goals).slice(0, 8),
      plans: (c.plans ?? old.plans).slice(0, 8),
      intentions: c.intentions ?? old.intentions,
      beliefs: (c.beliefs ?? old.beliefs).slice(-20),
      trust_user: clamp(old.trust_user, c.trust_user),
      affection_user: clamp(old.affection_user, c.affection_user),
      user_view: c.user_view ?? old.user_view,
      relationships: {
        ...old.relationships,
        ...Object.fromEntries((c.relationships ?? []).filter((r) => castIds.has(r.id) && r.id !== c.id).map((r) => [r.id, r.note])),
      },
    };
  }
  if (Array.isArray(d.threads)) next.threads = d.threads.slice(0, 12);
  return next;
}

async function chronicle(sessionId: string, turnId: string, userMsg: MessageRow | null, produced: MessageRow[], advanced: boolean) {
  const w = loadWorld(sessionId);
  const settings = getModelSettings();
  const p = chroniclerPrompt({
    plot: w.plot, persona: w.persona, state: w.session.state, cast: w.cast,
    turnTranscript: turnTranscript(w, userMsg, produced),
    recentMemories: w.memories.slice(-15).map((m) => m.content),
  });
  const { data, usage } = await getProvider().json<ChroniclerOutput>({
    model: settings.helperModel, system: { stable: p.stable, volatile: p.volatile }, user: p.user,
    effort: advanced ? "medium" : "low", maxTokens: 16000, schema: chroniclerSchema(w.cast.map((c) => c.id)),
  });
  addUsage(sessionId, w.session.usage, usage);
  const castIds = new Set(w.cast.map((c) => c.id));
  // The turn may have been regenerated meanwhile; only apply if its messages still exist.
  const still = loadWorld(sessionId);
  if (produced.length && !still.messages.some((m) => m.id === produced[0].id)) return;
  const next = applyChronicle(still.session.state, data, castIds);
  // Guard against a bad update emptying the scene: if a character spoke last and everyone vanished, keep the old list.
  const last = produced[produced.length - 1];
  if (next.scene.present.length === 0 && still.session.state.scene.present.length > 0 && last?.kind === "character") {
    next.scene.present = still.session.state.scene.present;
  }
  updateSession(sessionId, { state: next });
  const witnessed = new Set([...(userMsg?.witnesses ?? []), ...produced.flatMap((m) => m.witnesses)]);
  for (const m of data.memories ?? []) {
    if (!m.content?.trim()) continue;
    // A character can only remember what they could have witnessed this turn.
    const knownBy = (m.known_by ?? []).filter((id) => castIds.has(id) && witnessed.has(id));
    insertMemory({ session_id: sessionId, kind: m.kind || "event", content: m.content.trim(), importance: m.importance || 3, known_by: knownBy, turn_id: turnId });
  }
}

// ---------------------------------------------------------------------------
// Summarizer — keeps prompts small in long stories
// ---------------------------------------------------------------------------

const SUMMARIZE_AFTER = 50;
const KEEP_RECENT = 30;

async function maybeSummarize(sessionId: string, advanced: boolean) {
  const w = loadWorld(sessionId);
  const unsummarized = w.messages.filter((m) => m.seq > w.session.summarized_upto);
  if (unsummarized.length <= SUMMARIZE_AFTER) return;
  const chunk = unsummarized.slice(0, unsummarized.length - KEEP_RECENT);
  const upto = chunk[chunk.length - 1].seq;
  const lines = chunk.map((m) => {
    if (m.kind === "user") return `${w.userName} [seen by: ${m.witnesses.map((id) => w.castMap.get(id)?.name).join(", ") || "nobody"}]: ${perceivedOf(m, w.userName)}`;
    const who = m.kind === "narration" ? "Narration" : w.castMap.get(m.character_id ?? "")?.name ?? "Someone";
    return `${who} [seen by: ${m.witnesses.map((id) => w.castMap.get(id)?.name).join(", ") || "nobody"}]: ${m.content}`;
  }).join("\n\n");
  const prevPerspectives = w.cast.map((c) => `${c.name} (id=${c.id}): ${w.session.state.characters[c.id]?.perspective_summary || "(none yet)"}`).join("\n");
  const { data, usage } = await getProvider().json<{ outline: string; perspectives: { id: string; summary: string }[] }>({
    model: getModelSettings().helperModel,
    system: { stable: `${SUMMARIZER_RULES}\n\n${worldBlock(w.plot)}`, volatile: `PREVIOUS OUTLINE:\n${w.session.summary || "(none)"}\n\nPREVIOUS PERSPECTIVES:\n${prevPerspectives}` },
    user: `NEW EVENTS TO FOLD IN (each line lists who witnessed it):\n\n${lines}`,
    effort: advanced ? "medium" : "low", maxTokens: 16000, schema: summarizerSchema(w.cast.map((c) => c.id)),
  });
  addUsage(sessionId, w.session.usage, usage);
  const state = loadWorld(sessionId).session.state;
  for (const p of data.perspectives ?? []) {
    if (!w.castMap.has(p.id)) continue;
    state.characters[p.id] = { ...(state.characters[p.id] ?? emptyCharacterState()), perspective_summary: p.summary };
  }
  updateSession(sessionId, { summary: data.outline || w.session.summary, summarized_upto: upto, state });
}

// ---------------------------------------------------------------------------
// Re-interpret a user message after it was edited
// ---------------------------------------------------------------------------

export async function reinterpretUserMessage(sessionId: string, messageId: string): Promise<MessageRow | undefined> {
  const w = loadWorld(sessionId);
  const m = w.messages.find((x) => x.id === messageId);
  if (!m || m.kind !== "user") return m;
  const heur = heuristicInterpret(m.content, w.userName, w.cast);
  let interp = heur;
  if (needsInterpretation(m.content)) {
    try {
      const provider = getProvider();
      const p = directorPrompt({
        plot: w.plot, persona: w.persona, state: w.session.state, cast: w.cast, transcript: "", summary: "",
        userText: m.content, heuristicHint: JSON.stringify(heur.segments), manualSpeakers: null, addressedHint: [],
      });
      const { data, usage } = await provider.json<DirectorOutput>({
        model: getModelSettings().helperModel, system: { stable: p.stable, volatile: p.volatile },
        user: p.user + "\n\nOnly JOB 1 matters here; return an empty beats list.", effort: "low", maxTokens: 8000,
        schema: directorSchema(w.cast.map((c) => c.id)),
      });
      addUsage(sessionId, w.session.usage, usage);
      interp = sanitizeInterpretation(data, heur, w);
    } catch {
      /* keep heuristic */
    }
  }
  updateMessage(m.id, { perceived: interp.perceived, private_note: interp.private_note || null });
  return { ...m, perceived: interp.perceived, private_note: interp.private_note || null };
}
