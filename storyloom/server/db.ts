// Storage: one SQLite file (built into Node, no extra service to run) + an uploads folder.
// Everything lives in DATA_DIR so a single persistent disk/volume keeps the whole app.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { SessionState } from "./engine/types.ts";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let db: DatabaseSync | null = null;

export function newId(prefix = ""): string {
  return prefix + crypto.randomBytes(9).toString("base64url");
}

export function now(): string {
  return new Date().toISOString();
}

const MIGRATIONS: string[] = [
  // 1 — initial schema. Never edit a migration that has already run; append a new one.
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

  CREATE TABLE personas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    appearance TEXT NOT NULL DEFAULT '',
    background TEXT NOT NULL DEFAULT '',
    personality TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    relationships TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    images TEXT NOT NULL DEFAULT '[]',
    tagline TEXT NOT NULL DEFAULT '',
    appearance TEXT NOT NULL DEFAULT '',
    personality TEXT NOT NULL DEFAULT '',
    intelligence TEXT NOT NULL DEFAULT '',
    background TEXT NOT NULL DEFAULT '',
    speaking_style TEXT NOT NULL DEFAULT '',
    emotional_tendencies TEXT NOT NULL DEFAULT '',
    motivations TEXT NOT NULL DEFAULT '',
    values_boundaries TEXT NOT NULL DEFAULT '',
    fears TEXT NOT NULL DEFAULT '',
    relationships TEXT NOT NULL DEFAULT '',
    relationship_to_user TEXT NOT NULL DEFAULT '',
    secrets TEXT NOT NULL DEFAULT '',
    example_dialogue TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE plots (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover TEXT,
    description TEXT NOT NULL DEFAULT '',
    setting TEXT NOT NULL DEFAULT '',
    lore TEXT NOT NULL DEFAULT '',
    scenario TEXT NOT NULL DEFAULT '',
    start_location TEXT NOT NULL DEFAULT '',
    persona_id TEXT REFERENCES personas(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE plot_characters (
    plot_id TEXT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    role_note TEXT NOT NULL DEFAULT '',
    starts_present INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (plot_id, character_id)
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    plot_id TEXT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    speaker_mode TEXT NOT NULL DEFAULT 'auto',
    intelligence TEXT NOT NULL DEFAULT 'normal',
    state TEXT NOT NULL DEFAULT '{}',
    summary TEXT NOT NULL DEFAULT '',
    summarized_upto INTEGER NOT NULL DEFAULT 0,
    usage TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    kind TEXT NOT NULL,            -- user | character | narration
    character_id TEXT,
    content TEXT NOT NULL,
    perceived TEXT,                -- user messages: what other people in the scene can perceive
    private_note TEXT,             -- user messages: private thoughts/decisions (never shown to characters)
    witnesses TEXT NOT NULL DEFAULT '[]',
    turn_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX messages_session_seq ON messages(session_id, seq);

  CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'event',
    content TEXT NOT NULL,
    importance INTEGER NOT NULL DEFAULT 3,
    known_by TEXT NOT NULL DEFAULT '[]',
    pinned INTEGER NOT NULL DEFAULT 0,
    turn_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX memories_session ON memories(session_id);

  CREATE TABLE turn_snapshots (
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    turn_id TEXT NOT NULL,
    state TEXT NOT NULL,
    summary TEXT NOT NULL,
    summarized_upto INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (session_id, turn_id)
  );
  `,
];

export function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const file = process.env.DB_FILE || path.join(DATA_DIR, "storyloom.db");
  db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

/** Used by tests: open a fresh in-memory database. */
export function useMemoryDb(): DatabaseSync {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function migrate(d: DatabaseSync) {
  d.exec("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");
  const row = d.prepare("SELECT version FROM schema_version").get() as { version: number } | undefined;
  let version = row?.version ?? 0;
  if (!row) d.prepare("INSERT INTO schema_version (version) VALUES (0)").run();
  while (version < MIGRATIONS.length) {
    d.exec("BEGIN");
    try {
      d.exec(MIGRATIONS[version]);
      version++;
      d.prepare("UPDATE schema_version SET version = ?").run(version);
      d.exec("COMMIT");
    } catch (e) {
      d.exec("ROLLBACK");
      throw e;
    }
  }
}

export function tx<T>(fn: () => T): T {
  const d = getDb();
  d.exec("BEGIN");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

// ---------- settings ----------
export function getSetting(key: string): string | undefined {
  const r = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return r?.value;
}
export function setSetting(key: string, value: string | null) {
  if (value === null) getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
  else getDb().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

// ---------- row types ----------
export interface CharacterRow {
  id: string; name: string; avatar: string | null; images: string[]; tagline: string;
  appearance: string; personality: string; intelligence: string; background: string;
  speaking_style: string; emotional_tendencies: string; motivations: string; values_boundaries: string;
  fears: string; relationships: string; relationship_to_user: string; secrets: string;
  example_dialogue: string; instructions: string; created_at: string; updated_at: string;
}
export const CHARACTER_TEXT_FIELDS = [
  "name", "tagline", "appearance", "personality", "intelligence", "background", "speaking_style",
  "emotional_tendencies", "motivations", "values_boundaries", "fears", "relationships",
  "relationship_to_user", "secrets", "example_dialogue", "instructions",
] as const;

export interface PersonaRow {
  id: string; name: string; avatar: string | null; appearance: string; background: string;
  personality: string; role: string; relationships: string; instructions: string;
  created_at: string; updated_at: string;
}
export const PERSONA_TEXT_FIELDS = ["name", "appearance", "background", "personality", "role", "relationships", "instructions"] as const;

export interface PlotRow {
  id: string; title: string; cover: string | null; description: string; setting: string; lore: string;
  scenario: string; start_location: string; persona_id: string | null; created_at: string; updated_at: string;
}
export const PLOT_TEXT_FIELDS = ["title", "description", "setting", "lore", "scenario", "start_location"] as const;

export interface PlotCharacter { character_id: string; role_note: string; starts_present: boolean; sort: number }

export interface SessionRow {
  id: string; plot_id: string; title: string; speaker_mode: "auto" | "manual"; intelligence: "normal" | "advanced";
  state: SessionState; summary: string; summarized_upto: number; usage: UsageTotals; created_at: string; updated_at: string;
}
export interface UsageTotals { input_tokens?: number; output_tokens?: number; cache_read_tokens?: number; cost_usd?: number; calls?: number }

export interface MessageRow {
  id: string; session_id: string; seq: number; kind: "user" | "character" | "narration";
  character_id: string | null; content: string; perceived: string | null; private_note: string | null;
  witnesses: string[]; turn_id: string | null; created_at: string;
}

export interface MemoryRow {
  id: string; session_id: string; kind: string; content: string; importance: number;
  known_by: string[]; pinned: boolean; turn_id: string | null; created_at: string; updated_at: string;
}

function parseJson<T>(s: unknown, fallback: T): T {
  if (typeof s !== "string") return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

// ---------- characters ----------
function rowToCharacter(r: Record<string, unknown>): CharacterRow {
  return { ...(r as unknown as CharacterRow), images: parseJson<string[]>(r.images, []) };
}
export function listCharacters(): CharacterRow[] {
  return (getDb().prepare("SELECT * FROM characters ORDER BY name COLLATE NOCASE").all() as Record<string, unknown>[]).map(rowToCharacter);
}
export function getCharacter(id: string): CharacterRow | undefined {
  const r = getDb().prepare("SELECT * FROM characters WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? rowToCharacter(r) : undefined;
}
export function saveCharacter(input: Partial<CharacterRow> & { id?: string }): CharacterRow {
  const d = getDb();
  const existing = input.id ? getCharacter(input.id) : undefined;
  const id = existing?.id ?? newId("c_");
  const merged: CharacterRow = {
    ...(existing ?? ({} as CharacterRow)),
    ...Object.fromEntries(CHARACTER_TEXT_FIELDS.map((f) => [f, String(input[f] ?? existing?.[f] ?? "")])),
    id,
    avatar: input.avatar !== undefined ? input.avatar : existing?.avatar ?? null,
    images: input.images ?? existing?.images ?? [],
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
  } as CharacterRow;
  if (!merged.name.trim()) merged.name = "Unnamed";
  const cols = ["id", ...CHARACTER_TEXT_FIELDS, "avatar", "images", "created_at", "updated_at"];
  const vals = cols.map((c) => (c === "images" ? JSON.stringify(merged.images) : (merged as unknown as Record<string, unknown>)[c] ?? null));
  d.prepare(`INSERT OR REPLACE INTO characters (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).run(...(vals as (string | null)[]));
  return getCharacter(id)!;
}
export function deleteCharacter(id: string) {
  getDb().prepare("DELETE FROM characters WHERE id = ?").run(id);
}

// ---------- personas ----------
export function listPersonas(): PersonaRow[] {
  return getDb().prepare("SELECT * FROM personas ORDER BY name COLLATE NOCASE").all() as unknown as PersonaRow[];
}
export function getPersona(id: string | null | undefined): PersonaRow | undefined {
  if (!id) return undefined;
  return getDb().prepare("SELECT * FROM personas WHERE id = ?").get(id) as unknown as PersonaRow | undefined;
}
export function savePersona(input: Partial<PersonaRow>): PersonaRow {
  const existing = input.id ? getPersona(input.id) : undefined;
  const id = existing?.id ?? newId("p_");
  const merged = {
    ...Object.fromEntries(PERSONA_TEXT_FIELDS.map((f) => [f, String(input[f] ?? existing?.[f] ?? "")])),
    id,
    avatar: input.avatar !== undefined ? input.avatar : existing?.avatar ?? null,
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
  } as PersonaRow;
  if (!merged.name.trim()) merged.name = "Me";
  const cols = ["id", ...PERSONA_TEXT_FIELDS, "avatar", "created_at", "updated_at"];
  getDb().prepare(`INSERT OR REPLACE INTO personas (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`)
    .run(...cols.map((c) => (merged as unknown as Record<string, string | null>)[c] ?? null));
  return getPersona(id)!;
}
export function deletePersona(id: string) {
  getDb().prepare("DELETE FROM personas WHERE id = ?").run(id);
}

// ---------- plots ----------
export function listPlots(): (PlotRow & { character_ids: string[]; session_count: number; last_played: string | null })[] {
  const rows = getDb().prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM sessions s WHERE s.plot_id = p.id) AS session_count,
           (SELECT MAX(s.updated_at) FROM sessions s WHERE s.plot_id = p.id) AS last_played
    FROM plots p ORDER BY COALESCE(last_played, p.updated_at) DESC`).all() as Record<string, unknown>[];
  return rows.map((r) => ({
    ...(r as unknown as PlotRow & { session_count: number; last_played: string | null }),
    character_ids: getPlotCharacters(String(r.id)).map((c) => c.character_id),
  }));
}
export function getPlot(id: string): PlotRow | undefined {
  return getDb().prepare("SELECT * FROM plots WHERE id = ?").get(id) as unknown as PlotRow | undefined;
}
export function getPlotCharacters(plotId: string): PlotCharacter[] {
  return (getDb().prepare("SELECT character_id, role_note, starts_present, sort FROM plot_characters WHERE plot_id = ? ORDER BY sort").all(plotId) as Record<string, unknown>[])
    .map((r) => ({ character_id: String(r.character_id), role_note: String(r.role_note), starts_present: !!r.starts_present, sort: Number(r.sort) }));
}
export function savePlot(input: Partial<PlotRow> & { characters?: PlotCharacter[] }): PlotRow {
  return tx(() => {
    const existing = input.id ? getPlot(input.id) : undefined;
    const id = existing?.id ?? newId("pl_");
    const merged = {
      ...Object.fromEntries(PLOT_TEXT_FIELDS.map((f) => [f, String(input[f] ?? existing?.[f] ?? "")])),
      id,
      cover: input.cover !== undefined ? input.cover : existing?.cover ?? null,
      persona_id: input.persona_id !== undefined ? input.persona_id || null : existing?.persona_id ?? null,
      created_at: existing?.created_at ?? now(),
      updated_at: now(),
    } as PlotRow;
    if (!merged.title.trim()) merged.title = "Untitled Plot";
    const cols = ["id", ...PLOT_TEXT_FIELDS, "cover", "persona_id", "created_at", "updated_at"];
    // UPDATE instead of REPLACE so ON DELETE CASCADE does not wipe sessions.
    if (existing) {
      getDb().prepare(`UPDATE plots SET ${cols.slice(1).map((c) => `${c} = ?`).join(", ")} WHERE id = ?`)
        .run(...cols.slice(1).map((c) => (merged as unknown as Record<string, string | null>)[c] ?? null), id);
    } else {
      getDb().prepare(`INSERT INTO plots (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`)
        .run(...cols.map((c) => (merged as unknown as Record<string, string | null>)[c] ?? null));
    }
    if (input.characters) {
      getDb().prepare("DELETE FROM plot_characters WHERE plot_id = ?").run(id);
      const ins = getDb().prepare("INSERT OR IGNORE INTO plot_characters (plot_id, character_id, role_note, starts_present, sort) VALUES (?,?,?,?,?)");
      input.characters.forEach((c, i) => {
        if (getCharacter(c.character_id)) ins.run(id, c.character_id, c.role_note ?? "", c.starts_present === false ? 0 : 1, i);
      });
    }
    return getPlot(id)!;
  });
}
export function deletePlot(id: string) {
  getDb().prepare("DELETE FROM plots WHERE id = ?").run(id);
}
export function duplicatePlot(id: string): PlotRow | undefined {
  const p = getPlot(id);
  if (!p) return undefined;
  return savePlot({ ...p, id: undefined, title: `${p.title} (copy)`, characters: getPlotCharacters(id) });
}

// ---------- sessions ----------
function rowToSession(r: Record<string, unknown>): SessionRow {
  return {
    ...(r as unknown as SessionRow),
    state: parseJson<SessionState>(r.state, { scene: { location: "", time: "", description: "", present: [] }, characters: {}, threads: [] }),
    usage: parseJson<UsageTotals>(r.usage, {}),
  };
}
export function listSessions(plotId: string): (SessionRow & { message_count: number; last_message: string | null })[] {
  return (getDb().prepare(`SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count,
      (SELECT content FROM messages m WHERE m.session_id = s.id ORDER BY seq DESC LIMIT 1) AS last_message
      FROM sessions s WHERE plot_id = ? ORDER BY updated_at DESC`).all(plotId) as Record<string, unknown>[])
    .map((r) => ({ ...rowToSession(r), message_count: Number(r.message_count), last_message: (r.last_message as string) ?? null }));
}
export function getSession(id: string): SessionRow | undefined {
  const r = getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? rowToSession(r) : undefined;
}
export function insertSession(s: Omit<SessionRow, "created_at" | "updated_at" | "usage"> & { usage?: UsageTotals }): SessionRow {
  getDb().prepare(`INSERT INTO sessions (id, plot_id, title, speaker_mode, intelligence, state, summary, summarized_upto, usage, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(s.id, s.plot_id, s.title, s.speaker_mode, s.intelligence, JSON.stringify(s.state), s.summary, s.summarized_upto, JSON.stringify(s.usage ?? {}), now(), now());
  return getSession(s.id)!;
}
export function updateSession(id: string, patch: Partial<Pick<SessionRow, "title" | "speaker_mode" | "intelligence" | "state" | "summary" | "summarized_upto" | "usage">>) {
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    vals.push(typeof v === "object" ? JSON.stringify(v) : (v as string | number));
  }
  sets.push("updated_at = ?");
  vals.push(now());
  getDb().prepare(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
}
export function deleteSession(id: string) {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

// ---------- messages ----------
function rowToMessage(r: Record<string, unknown>): MessageRow {
  return { ...(r as unknown as MessageRow), witnesses: parseJson<string[]>(r.witnesses, []) };
}
export function listMessages(sessionId: string): MessageRow[] {
  return (getDb().prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY seq").all(sessionId) as Record<string, unknown>[]).map(rowToMessage);
}
export function getMessage(id: string): MessageRow | undefined {
  const r = getDb().prepare("SELECT * FROM messages WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? rowToMessage(r) : undefined;
}
export function insertMessage(m: Omit<MessageRow, "id" | "seq" | "created_at"> & { id?: string }): MessageRow {
  const d = getDb();
  const seqRow = d.prepare("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM messages WHERE session_id = ?").get(m.session_id) as { next: number };
  const id = m.id ?? newId("m_");
  d.prepare(`INSERT INTO messages (id, session_id, seq, kind, character_id, content, perceived, private_note, witnesses, turn_id, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id, m.session_id, seqRow.next, m.kind, m.character_id, m.content, m.perceived, m.private_note, JSON.stringify(m.witnesses), m.turn_id, now());
  return getMessage(id)!;
}
export function updateMessage(id: string, patch: Partial<Pick<MessageRow, "content" | "perceived" | "private_note">>) {
  const sets: string[] = [];
  const vals: (string | null)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    vals.push(v as string | null);
  }
  if (!sets.length) return;
  getDb().prepare(`UPDATE messages SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
}
export function setWitnesses(id: string, witnesses: string[]) {
  getDb().prepare("UPDATE messages SET witnesses = ? WHERE id = ?").run(JSON.stringify(witnesses), id);
}
export function deleteMessage(id: string) {
  getDb().prepare("DELETE FROM messages WHERE id = ?").run(id);
}
export function searchMessages(sessionId: string, q: string): MessageRow[] {
  const like = `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
  return (getDb().prepare("SELECT * FROM messages WHERE session_id = ? AND content LIKE ? ESCAPE '\\' ORDER BY seq").all(sessionId, like) as Record<string, unknown>[]).map(rowToMessage);
}

// ---------- memories ----------
function rowToMemory(r: Record<string, unknown>): MemoryRow {
  return { ...(r as unknown as MemoryRow), known_by: parseJson<string[]>(r.known_by, []), pinned: !!r.pinned };
}
export function listMemories(sessionId: string): MemoryRow[] {
  return (getDb().prepare("SELECT * FROM memories WHERE session_id = ? ORDER BY created_at").all(sessionId) as Record<string, unknown>[]).map(rowToMemory);
}
export function getMemory(id: string): MemoryRow | undefined {
  const r = getDb().prepare("SELECT * FROM memories WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? rowToMemory(r) : undefined;
}
export function insertMemory(m: { session_id: string; kind: string; content: string; importance: number; known_by: string[]; pinned?: boolean; turn_id: string | null }): MemoryRow {
  const id = newId("mem_");
  getDb().prepare(`INSERT INTO memories (id, session_id, kind, content, importance, known_by, pinned, turn_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, m.session_id, m.kind, m.content, Math.max(1, Math.min(5, Math.round(m.importance))), JSON.stringify(m.known_by), m.pinned ? 1 : 0, m.turn_id, now(), now());
  return getMemory(id)!;
}
export function updateMemory(id: string, patch: Partial<Pick<MemoryRow, "content" | "importance" | "known_by" | "pinned" | "kind">>) {
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    vals.push(k === "known_by" ? JSON.stringify(v) : k === "pinned" ? (v ? 1 : 0) : (v as string | number));
  }
  sets.push("updated_at = ?");
  vals.push(now());
  getDb().prepare(`UPDATE memories SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
}
export function deleteMemory(id: string) {
  getDb().prepare("DELETE FROM memories WHERE id = ?").run(id);
}

// ---------- snapshots (for regenerate) ----------
export function saveSnapshot(sessionId: string, turnId: string) {
  const s = getSession(sessionId)!;
  getDb().prepare("INSERT OR REPLACE INTO turn_snapshots (turn_id, session_id, state, summary, summarized_upto, created_at) VALUES (?,?,?,?,?,?)")
    .run(turnId, sessionId, JSON.stringify(s.state), s.summary, s.summarized_upto, now());
}
export function getSnapshot(sessionId: string, turnId: string): { state: SessionState; summary: string; summarized_upto: number } | undefined {
  const r = getDb().prepare("SELECT * FROM turn_snapshots WHERE session_id = ? AND turn_id = ?").get(sessionId, turnId) as Record<string, unknown> | undefined;
  if (!r) return undefined;
  return { state: parseJson<SessionState>(r.state, {} as SessionState), summary: String(r.summary), summarized_upto: Number(r.summarized_upto) };
}

// ---------- duplicate a whole save ----------
export function duplicateSession(id: string, title?: string): SessionRow | undefined {
  const s = getSession(id);
  if (!s) return undefined;
  return tx(() => {
    const newSid = newId("s_");
    insertSession({ ...s, id: newSid, title: title || `${s.title} (branch)` });
    const d = getDb();
    for (const m of listMessages(id)) {
      d.prepare(`INSERT INTO messages (id, session_id, seq, kind, character_id, content, perceived, private_note, witnesses, turn_id, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(newId("m_"), newSid, m.seq, m.kind, m.character_id, m.content, m.perceived, m.private_note, JSON.stringify(m.witnesses), m.turn_id, m.created_at);
    }
    for (const m of listMemories(id)) {
      d.prepare(`INSERT INTO memories (id, session_id, kind, content, importance, known_by, pinned, turn_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(newId("mem_"), newSid, m.kind, m.content, m.importance, JSON.stringify(m.known_by), m.pinned ? 1 : 0, m.turn_id, m.created_at, m.updated_at);
    }
    const snaps = d.prepare("SELECT * FROM turn_snapshots WHERE session_id = ?").all(id) as Record<string, string | number>[];
    for (const sn of snaps) {
      d.prepare("INSERT OR REPLACE INTO turn_snapshots (turn_id, session_id, state, summary, summarized_upto, created_at) VALUES (?,?,?,?,?,?)")
        .run(sn.turn_id, newSid, sn.state, sn.summary, sn.summarized_upto, sn.created_at);
    }
    return getSession(newSid)!;
  });
}

