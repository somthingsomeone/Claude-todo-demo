import {
  getCharacter, getPersona, getPlot, getPlotCharacters, getSession, listMemories, listMessages,
  type CharacterRow, type MemoryRow, type MessageRow, type PersonaRow, type PlotRow, type SessionRow,
} from "../db.ts";
import { heuristicInterpret } from "./roleplay-format.ts";
import { personaName } from "./prompts.ts";

export interface World {
  session: SessionRow;
  plot: PlotRow;
  persona: PersonaRow | undefined;
  cast: CharacterRow[];
  castMap: Map<string, CharacterRow>;
  messages: MessageRow[];
  memories: MemoryRow[];
  userName: string;
}

export function loadWorld(sessionId: string): World {
  const session = getSession(sessionId);
  if (!session) throw new Error("Story session not found.");
  const plot = getPlot(session.plot_id);
  if (!plot) throw new Error("Plot not found.");
  const persona = getPersona(plot.persona_id);
  const cast = getPlotCharacters(plot.id).map((pc) => getCharacter(pc.character_id)).filter((c): c is CharacterRow => !!c);
  return {
    session, plot, persona, cast, castMap: new Map(cast.map((c) => [c.id, c])),
    messages: listMessages(sessionId), memories: listMemories(sessionId), userName: personaName(persona),
  };
}

/** The outward version of a user message (never includes private thoughts). */
export function perceivedOf(m: MessageRow, userName: string): string {
  if (m.perceived !== null && m.perceived !== undefined && m.perceived !== "") return m.perceived;
  return heuristicInterpret(m.content, userName).perceived;
}

function line(m: MessageRow, w: World, selfId: string | null): string {
  if (m.kind === "user") return `${w.userName}: ${perceivedOf(m, w.userName) || "*stays silent*"}`;
  if (m.kind === "narration") return `[Narration] ${m.content}`;
  const name = w.castMap.get(m.character_id ?? "")?.name ?? "Someone";
  return `${name}${m.character_id === selfId ? " (you)" : ""}: ${m.content}`;
}

/** Recent messages after the summarized point, filtered to what `characterId` witnessed. */
export function transcriptFor(w: World, characterId: string | null, limit: number): string {
  const recent = w.messages.filter((m) => m.seq > w.session.summarized_upto);
  const visible = characterId === null ? recent : recent.filter((m) => m.character_id === characterId || m.witnesses.includes(characterId));
  return visible.slice(-limit).map((m) => line(m, w, characterId)).join("\n\n");
}

const STOP = new Set("the a an and or but of to in on at for with is are was were be been it its this that he she they them his her their you your i me my we our as by from not no so do did does have has had will would can could just what who how why when where there here then than into out up".split(" "));

export function keywords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

/**
 * Pick the memories most useful right now for one character (or for everyone when null):
 * pinned first, then a mix of importance, relevance to the recent conversation, and recency.
 */
export function relevantMemories(w: World, characterId: string | null, limit: number): MemoryRow[] {
  const pool = w.memories.filter((m) => (characterId === null ? true : m.known_by.includes(characterId)));
  if (pool.length <= limit) return pool;
  const recentText = w.messages.slice(-6).map((m) => (m.kind === "user" ? perceivedOf(m, w.userName) : m.content)).join(" ");
  const kw = keywords(recentText);
  const n = pool.length;
  const scored = pool.map((m, idx) => {
    let overlap = 0;
    for (const k of keywords(m.content)) if (kw.has(k)) overlap++;
    const score = (m.pinned ? 100 : 0) + m.importance * 2 + Math.min(overlap, 5) * 2.5 + (idx / n) * 3;
    return { m, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.m)
    // keep chronological order for readability
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
