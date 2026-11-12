// Browser twin of server/db.ts with the same function names and signatures, so the story engine
// (server/engine/*) runs unchanged inside the Artifact. Reads are synchronous from memory;
// every change is saved to the Artifact's storage in the background (see storage.ts).
import type {
  CharacterRow, MemoryRow, MessageRow, PersonaRow, PlotCharacter, PlotRow, SessionRow, UsageTotals,
} from "../../server/db.ts";
import type { SessionState } from "../../server/engine/types.ts";
import { openStore, type Store } from "./storage.ts";

export type { CharacterRow, MemoryRow, MessageRow, PersonaRow, PlotCharacter, PlotRow, SessionRow, UsageTotals };

export const CHARACTER_TEXT_FIELDS = [
  "name", "tagline", "appearance", "personality", "intelligence", "background", "speaking_style",
  "emotional_tendencies", "motivations", "values_boundaries", "fears", "relationships",
  "relationship_to_user", "secrets", "example_dialogue", "instructions",
] as const;
export const PERSONA_TEXT_FIELDS = ["name", "appearance", "background", "personality", "role", "relationships", "instructions"] as const;
export const PLOT_TEXT_FIELDS = ["title", "description", "setting", "lore", "scenario", "start_location"] as const;

const CHUNK = 40;
const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export function newId(prefix = ""): string {
  const a = new Uint8Array(9);
  crypto.getRandomValues(a);
  return prefix + btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function now(): string {
  return new Date().toISOString();
}
export function tx<T>(fn: () => T): T {
  return fn();
}

// ---------------------------------------------------------------------------
// memory + persistence
// ---------------------------------------------------------------------------
let store: Store;
let settings: Record<string, string> = {};
const characters = new Map<string, CharacterRow>();
const personas = new Map<string, PersonaRow>();
const plots = new Map<string, PlotRow & { characters: PlotCharacter[] }>();
const sessions = new Map<string, SessionRow>();
const messages = new Map<string, MessageRow[]>();
const memories = new Map<string, MemoryRow[]>();
const snapshots = new Map<string, { turn_id: string; state: SessionState; summary: string; summarized_upto: number }[]>();
const loaded = new Set<string>();
const chunkCount = new Map<string, number>();

const dirty = new Set<string>();
const lastWritten = new Map<string, string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;
let onError: (msg: string | null) => void = () => {};
let onSaving: (busy: boolean) => void = () => {};

export function storageKind() {
  return store?.kind;
}
export function onSaveState(err: (msg: string | null) => void, busy: (b: boolean) => void) {
  onError = err;
  onSaving = busy;
}

export async function init() {
  store = await openStore();
  const [cs, ps, pl, ss, st] = await Promise.all([
    store.list("characters"), store.list("personas"), store.list("plots"), store.list("sessions"), store.get("settings", "all"),
  ]);
  for (const d of cs) characters.set(d.id, d.data as unknown as CharacterRow);
  for (const d of ps) personas.set(d.id, d.data as unknown as PersonaRow);
  for (const d of pl) plots.set(d.id, d.data as unknown as PlotRow & { characters: PlotCharacter[] });
  for (const d of ss) sessions.set(d.id, d.data as unknown as SessionRow);
  settings = (st as Record<string, string>) ?? {};
  for (const [k, m] of [["characters", characters], ["personas", personas], ["plots", plots], ["sessions", sessions]] as const) {
    for (const [id, v] of m) lastWritten.set(`${k}/${id}`, JSON.stringify(v));
  }
}

/** Load a story's messages, memories and snapshots (done once, when it is opened). */
export async function ensureSession(sid: string) {
  if (loaded.has(sid) || !sessions.has(sid)) return;
  const [chunks, mem, snap] = await Promise.all([store.list("msgs", ["sid", sid]), store.get("mems", sid), store.get("snaps", sid)]);
  const sorted = chunks.map((c) => c.data as { n: number; list: MessageRow[] }).sort((a, b) => a.n - b.n);
  messages.set(sid, sorted.flatMap((c) => c.list));
  chunkCount.set(sid, sorted.length);
  for (const c of chunks) lastWritten.set(`msgs/${c.id}`, JSON.stringify(c.data));
  memories.set(sid, ((mem?.list as MemoryRow[]) ?? []));
  snapshots.set(sid, ((snap?.list as never[]) ?? []));
  loaded.add(sid);
}

function mark(key: string) {
  dirty.add(key);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), 350);
}

export async function flush(): Promise<void> {
  if (flushing) {
    await flushing;
    if (dirty.size) return flush();
    return;
  }
  if (!dirty.size) return;
  onSaving(true);
  flushing = (async () => {
    const keys = [...dirty];
    dirty.clear();
    let failed: string | null = null;
    for (const key of keys) {
      try {
        await writeKey(key);
      } catch (e) {
        failed = (e as { message?: string })?.message ?? String(e);
        dirty.add(key);
      }
    }
    onError(failed ? `Couldn't save some changes (${failed}). They will be retried.` : null);
    if (failed && !flushTimer) flushTimer = setTimeout(() => void flush(), 5000);
  })();
  try {
    await flushing;
  } finally {
    flushing = null;
    onSaving(false);
  }
}

async function put(coll: string, id: string, data: object | undefined) {
  const k = `${coll}/${id}`;
  if (data === undefined) {
    if (lastWritten.has(k) || coll !== "msgs") await store.del(coll, id);
    lastWritten.delete(k);
    return;
  }
  const json = JSON.stringify(data);
  if (lastWritten.get(k) === json) return;
  await store.set(coll, id, data as Record<string, unknown>);
  lastWritten.set(k, json);
}

async function writeKey(key: string) {
  flushTimer = null;
  const [coll, id] = key.split("|");
  switch (coll) {
    case "characters": return put(coll, id, characters.get(id));
    case "personas": return put(coll, id, personas.get(id));
    case "plots": return put(coll, id, plots.get(id));
    case "sessions": return put(coll, id, sessions.get(id));
    case "settings": return put("settings", "all", settings);
    case "mems": return put("mems", id, memories.has(id) && sessions.has(id) ? { sid: id, list: memories.get(id) } : undefined);
    case "snaps": return put("snaps", id, snapshots.has(id) && sessions.has(id) ? { sid: id, list: snapshots.get(id) } : undefined);
    case "msgs": {
      const list = sessions.has(id) ? messages.get(id) ?? [] : [];
      const n = Math.ceil(list.length / CHUNK);
      for (let i = 0; i < n; i++) await put("msgs", `${id}~${i}`, { sid: id, n: i, list: list.slice(i * CHUNK, (i + 1) * CHUNK) });
      const before = chunkCount.get(id) ?? 0;
      for (let i = n; i < before; i++) await put("msgs", `${id}~${i}`, undefined);
      chunkCount.set(id, n);
      return;
    }
  }
}
const touch = (coll: string, id: string) => mark(`${coll}|${id}`);

// ---------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------
export function getSetting(key: string): string | undefined {
  return settings[key];
}
export function setSetting(key: string, value: string | null) {
  if (value === null) delete settings[key];
  else settings[key] = value;
  touch("settings", "all");
}

// ---------------------------------------------------------------------------
// characters & personas
// ---------------------------------------------------------------------------
export function listCharacters(): CharacterRow[] {
  return clone([...characters.values()].sort((a, b) => a.name.localeCompare(b.name)));
}
export function getCharacter(id: string): CharacterRow | undefined {
  return clone(characters.get(id));
}
export function saveCharacter(input: Partial<CharacterRow> & { id?: string }): CharacterRow {
  const existing = input.id ? characters.get(input.id) : undefined;
  const id = existing?.id ?? newId("c_");
  const row = {
    ...(existing ?? {}),
    ...Object.fromEntries(CHARACTER_TEXT_FIELDS.map((f) => [f, String(input[f] ?? existing?.[f] ?? "")])),
    id,
    avatar: input.avatar !== undefined ? input.avatar : existing?.avatar ?? null,
    images: input.images ?? existing?.images ?? [],
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
  } as CharacterRow;
  if (!row.name.trim()) row.name = "Unnamed";
  characters.set(id, row);
  touch("characters", id);
  return clone(row);
}
export function deleteCharacter(id: string) {
  characters.delete(id);
  touch("characters", id);
  for (const p of plots.values()) {
    if (p.characters.some((c) => c.character_id === id)) {
      p.characters = p.characters.filter((c) => c.character_id !== id);
      touch("plots", p.id);
    }
  }
}
export function listPersonas(): PersonaRow[] {
  return clone([...personas.values()].sort((a, b) => a.name.localeCompare(b.name)));
}
export function getPersona(id: string | null | undefined): PersonaRow | undefined {
  return id ? clone(personas.get(id)) : undefined;
}
export function savePersona(input: Partial<PersonaRow>): PersonaRow {
  const existing = input.id ? personas.get(input.id) : undefined;
  const id = existing?.id ?? newId("p_");
  const row = {
    ...Object.fromEntries(PERSONA_TEXT_FIELDS.map((f) => [f, String(input[f] ?? existing?.[f] ?? "")])),
    id,
    avatar: input.avatar !== undefined ? input.avatar : existing?.avatar ?? null,
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
  } as PersonaRow;
  if (!row.name.trim()) row.name = "Me";
  personas.set(id, row);
  touch("personas", id);
  return clone(row);
}
export function deletePersona(id: string) {
  personas.delete(id);
  touch("personas", id);
  for (const p of plots.values()) {
    if (p.persona_id === id) {
      p.persona_id = null;
      touch("plots", p.id);
    }
  }
}

// ---------------------------------------------------------------------------
// plots
// ---------------------------------------------------------------------------
function plotRow(p: PlotRow & { characters: PlotCharacter[] }): PlotRow {
  const { characters: _c, ...rest } = p;
  return clone(rest);
}
export function listPlots(): (PlotRow & { character_ids: string[]; session_count: number; last_played: string | null })[] {
  return [...plots.values()].map((p) => {
    const ss = [...sessions.values()].filter((s) => s.plot_id === p.id);
    const last = ss.map((s) => s.updated_at).sort().pop() ?? null;
    return { ...plotRow(p), character_ids: p.characters.map((c) => c.character_id), session_count: ss.length, last_played: last };
  }).sort((a, b) => (b.last_played ?? b.updated_at).localeCompare(a.last_played ?? a.updated_at));
}
export function getPlot(id: string): PlotRow | undefined {
  const p = plots.get(id);
  return p ? plotRow(p) : undefined;
}
export function getPlotCharacters(plotId: string): PlotCharacter[] {
  return clone(plots.get(plotId)?.characters ?? []);
}
export function savePlot(input: Partial<PlotRow> & { characters?: PlotCharacter[] }): PlotRow {
  const existing = input.id ? plots.get(input.id) : undefined;
  const id = existing?.id ?? newId("pl_");
  const row = {
    ...Object.fromEntries(PLOT_TEXT_FIELDS.map((f) => [f, String(input[f] ?? existing?.[f] ?? "")])),
    id,
    cover: input.cover !== undefined ? input.cover : existing?.cover ?? null,
    persona_id: input.persona_id !== undefined ? input.persona_id || null : existing?.persona_id ?? null,
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
    characters: input.characters
      ? input.characters.filter((c) => characters.has(c.character_id)).map((c, i) => ({ character_id: c.character_id, role_note: c.role_note ?? "", starts_present: c.starts_present !== false, sort: i }))
      : existing?.characters ?? [],
  } as PlotRow & { characters: PlotCharacter[] };
  if (!row.title.trim()) row.title = "Untitled Plot";
  plots.set(id, row);
  touch("plots", id);
  return plotRow(row);
}
export function deletePlot(id: string) {
  for (const s of [...sessions.values()]) if (s.plot_id === id) deleteSession(s.id);
  plots.delete(id);
  touch("plots", id);
}
export function duplicatePlot(id: string): PlotRow | undefined {
  const p = getPlot(id);
  if (!p) return undefined;
  return savePlot({ ...p, id: undefined, title: `${p.title} (copy)`, characters: getPlotCharacters(id) });
}

// ---------------------------------------------------------------------------
// sessions (save slots)
// ---------------------------------------------------------------------------
export function listSessions(plotId: string): (SessionRow & { message_count: number; last_message: string | null })[] {
  return [...sessions.values()].filter((s) => s.plot_id === plotId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((s) => ({ ...clone(s), message_count: (s as SessionRow & { message_count?: number }).message_count ?? 0, last_message: (s as SessionRow & { last_message?: string }).last_message ?? null }));
}
export function getSession(id: string): SessionRow | undefined {
  const s = sessions.get(id);
  if (!s) return undefined;
  const { message_count: _m, last_message: _l, ...rest } = s as SessionRow & { message_count?: number; last_message?: string };
  return clone(rest as SessionRow);
}
export function insertSession(s: Omit<SessionRow, "created_at" | "updated_at" | "usage"> & { usage?: UsageTotals }): SessionRow {
  const row = { ...clone(s), usage: s.usage ?? {}, created_at: now(), updated_at: now() } as SessionRow;
  sessions.set(row.id, row);
  messages.set(row.id, []);
  memories.set(row.id, []);
  snapshots.set(row.id, []);
  loaded.add(row.id);
  touch("sessions", row.id);
  return getSession(row.id)!;
}
export function updateSession(id: string, patch: Partial<Pick<SessionRow, "title" | "speaker_mode" | "intelligence" | "state" | "summary" | "summarized_upto" | "usage">>) {
  const s = sessions.get(id);
  if (!s) return;
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) (s as unknown as Record<string, unknown>)[k] = clone(v);
  s.updated_at = now();
  touch("sessions", id);
}
/** Keep the list view's preview fields on the session document itself. */
function refreshPreview(sid: string) {
  const s = sessions.get(sid) as (SessionRow & { message_count?: number; last_message?: string | null }) | undefined;
  if (!s) return;
  const list = messages.get(sid) ?? [];
  s.message_count = list.length;
  s.last_message = list.length ? list[list.length - 1].content.slice(0, 200) : null;
  s.updated_at = now();
  touch("sessions", sid);
}
export function deleteSession(id: string) {
  sessions.delete(id);
  touch("sessions", id);
  touch("msgs", id);
  touch("mems", id);
  touch("snaps", id);
  messages.delete(id);
  memories.delete(id);
  snapshots.delete(id);
}

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------
function findMsg(id: string): { list: MessageRow[]; i: number; sid: string } | undefined {
  for (const [sid, list] of messages) {
    const i = list.findIndex((m) => m.id === id);
    if (i >= 0) return { list, i, sid };
  }
  return undefined;
}
export function listMessages(sessionId: string): MessageRow[] {
  return clone(messages.get(sessionId) ?? []);
}
export function getMessage(id: string): MessageRow | undefined {
  const f = findMsg(id);
  return f ? clone(f.list[f.i]) : undefined;
}
export function insertMessage(m: Omit<MessageRow, "id" | "seq" | "created_at"> & { id?: string }): MessageRow {
  const list = messages.get(m.session_id) ?? [];
  messages.set(m.session_id, list);
  const seq = (list.length ? list[list.length - 1].seq : 0) + 1;
  const row: MessageRow = { ...clone(m), id: m.id ?? newId("m_"), seq, created_at: now() } as MessageRow;
  list.push(row);
  touch("msgs", m.session_id);
  refreshPreview(m.session_id);
  return clone(row);
}
export function updateMessage(id: string, patch: Partial<Pick<MessageRow, "content" | "perceived" | "private_note">>) {
  const f = findMsg(id);
  if (!f) return;
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) (f.list[f.i] as unknown as Record<string, unknown>)[k] = v;
  touch("msgs", f.sid);
  refreshPreview(f.sid);
}
export function setWitnesses(id: string, witnesses: string[]) {
  const f = findMsg(id);
  if (!f) return;
  f.list[f.i].witnesses = [...witnesses];
  touch("msgs", f.sid);
}
export function deleteMessage(id: string) {
  const f = findMsg(id);
  if (!f) return;
  f.list.splice(f.i, 1);
  touch("msgs", f.sid);
  refreshPreview(f.sid);
}
export function searchMessages(sessionId: string, q: string): MessageRow[] {
  const needle = q.toLowerCase();
  return clone((messages.get(sessionId) ?? []).filter((m) => m.content.toLowerCase().includes(needle)));
}

// ---------------------------------------------------------------------------
// memories
// ---------------------------------------------------------------------------
function findMem(id: string): { list: MemoryRow[]; i: number; sid: string } | undefined {
  for (const [sid, list] of memories) {
    const i = list.findIndex((m) => m.id === id);
    if (i >= 0) return { list, i, sid };
  }
  return undefined;
}
export function listMemories(sessionId: string): MemoryRow[] {
  return clone(memories.get(sessionId) ?? []);
}
export function getMemory(id: string): MemoryRow | undefined {
  const f = findMem(id);
  return f ? clone(f.list[f.i]) : undefined;
}
export function insertMemory(m: { session_id: string; kind: string; content: string; importance: number; known_by: string[]; pinned?: boolean; turn_id: string | null }): MemoryRow {
  const list = memories.get(m.session_id) ?? [];
  memories.set(m.session_id, list);
  const row: MemoryRow = {
    id: newId("mem_"), session_id: m.session_id, kind: m.kind, content: m.content,
    importance: Math.max(1, Math.min(5, Math.round(m.importance))), known_by: [...m.known_by], pinned: !!m.pinned,
    turn_id: m.turn_id, created_at: now(), updated_at: now(),
  };
  list.push(row);
  // keep the memory document comfortably under the size limit
  if (list.length > 600) {
    const drop = list.filter((x) => !x.pinned).sort((a, b) => a.importance - b.importance || a.created_at.localeCompare(b.created_at))[0];
    if (drop) list.splice(list.indexOf(drop), 1);
  }
  touch("mems", m.session_id);
  return clone(row);
}
export function updateMemory(id: string, patch: Partial<Pick<MemoryRow, "content" | "importance" | "known_by" | "pinned" | "kind">>) {
  const f = findMem(id);
  if (!f) return;
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) (f.list[f.i] as unknown as Record<string, unknown>)[k] = clone(v);
  f.list[f.i].updated_at = now();
  touch("mems", f.sid);
}
export function deleteMemory(id: string) {
  const f = findMem(id);
  if (!f) return;
  f.list.splice(f.i, 1);
  touch("mems", f.sid);
}

// ---------------------------------------------------------------------------
// snapshots (for regenerate) — the last few turns per story
// ---------------------------------------------------------------------------
export function saveSnapshot(sessionId: string, turnId: string) {
  const s = sessions.get(sessionId);
  if (!s) return;
  const list = (snapshots.get(sessionId) ?? []).filter((x) => x.turn_id !== turnId);
  list.push({ turn_id: turnId, state: clone(s.state), summary: s.summary, summarized_upto: s.summarized_upto });
  snapshots.set(sessionId, list.slice(-3));
  touch("snaps", sessionId);
}
export function getSnapshot(sessionId: string, turnId: string): { state: SessionState; summary: string; summarized_upto: number } | undefined {
  const s = snapshots.get(sessionId)?.find((x) => x.turn_id === turnId);
  return s ? clone({ state: s.state, summary: s.summary, summarized_upto: s.summarized_upto }) : undefined;
}

// ---------------------------------------------------------------------------
// branch a whole save
// ---------------------------------------------------------------------------
export function duplicateSession(id: string, title?: string): SessionRow | undefined {
  const s = getSession(id);
  if (!s) return undefined;
  const sid = newId("s_");
  insertSession({ ...s, id: sid, title: title || `${s.title} (branch)` });
  messages.set(sid, clone(messages.get(id) ?? []).map((m) => ({ ...m, id: newId("m_"), session_id: sid })));
  memories.set(sid, clone(memories.get(id) ?? []).map((m) => ({ ...m, id: newId("mem_"), session_id: sid })));
  snapshots.set(sid, clone(snapshots.get(id) ?? []));
  updateSession(sid, { usage: s.usage });
  touch("msgs", sid);
  touch("mems", sid);
  touch("snaps", sid);
  refreshPreview(sid);
  return getSession(sid);
}

// ---------------------------------------------------------------------------
// backup
// ---------------------------------------------------------------------------
export async function exportAll(): Promise<string> {
  for (const id of sessions.keys()) await ensureSession(id);
  return JSON.stringify({
    app: "storyloom", version: 1, exported_at: now(), settings,
    characters: [...characters.values()], personas: [...personas.values()], plots: [...plots.values()],
    sessions: [...sessions.values()].map((s) => ({ ...s, messages: messages.get(s.id) ?? [], memories: memories.get(s.id) ?? [] })),
  });
}
export async function importAll(json: string): Promise<number> {
  const d = JSON.parse(json);
  if (d?.app !== "storyloom") throw new Error("That file isn't a Storyloom backup.");
  let n = 0;
  for (const c of d.characters ?? []) { characters.set(c.id, c); touch("characters", c.id); n++; }
  for (const p of d.personas ?? []) { personas.set(p.id, p); touch("personas", p.id); n++; }
  for (const p of d.plots ?? []) { plots.set(p.id, p); touch("plots", p.id); n++; }
  for (const s of d.sessions ?? []) {
    const { messages: ms, memories: mm, ...rest } = s;
    sessions.set(rest.id, rest);
    messages.set(rest.id, ms ?? []);
    memories.set(rest.id, mm ?? []);
    snapshots.set(rest.id, []);
    loaded.add(rest.id);
    for (const c of ["sessions", "msgs", "mems", "snaps"]) touch(c, rest.id);
    n++;
  }
  await flush();
  return n;
}
