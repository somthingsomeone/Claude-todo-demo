// In-page "server": the same routes the old HTTP API had, answered directly in the browser.
import * as db from "./db.ts";
import { aiAvailable, initProvider, MissingCredentialsError } from "./provider.ts";
import { useCap } from "./storage.ts";
import { createSession } from "../../server/engine/session.ts";
import { reinterpretUserMessage, runTurn, withSessionLock, type TurnEvent } from "../../server/engine/turn.ts";
import { emptyCharacterState, type SessionState } from "../../server/engine/types.ts";

let booted: Promise<void> | null = null;
export function boot(): Promise<void> {
  booted ??= Promise.all([db.init(), initProvider()]).then(() => {
    const save = () => void db.flush();
    document.addEventListener("visibilitychange", save);
    window.addEventListener("pagehide", save);
  });
  return booted;
}
export { aiAvailable };
export const storageKind = () => db.storageKind();
export const onSaveState = db.onSaveState;
export const exportAll = db.exportAll;
export const importAll = db.importAll;

export class LocalError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Body = Record<string, unknown>;
type Handler = (m: RegExpMatchArray, body: Body, query: URLSearchParams) => unknown | Promise<unknown>;
const routes: [string, RegExp, Handler][] = [];
const on = (method: string, pattern: string, h: Handler) =>
  routes.push([method, new RegExp("^" + pattern.replace(/:(\w+)/g, "([^/]+)") + "$"), h]);

function sessionPayload(id: string) {
  const s = db.getSession(id);
  if (!s) return undefined;
  const plot = db.getPlot(s.plot_id)!;
  return {
    session: s, plot, persona: db.getPersona(plot.persona_id) ?? null,
    cast: db.getPlotCharacters(plot.id).map((c) => db.getCharacter(c.character_id)).filter(Boolean),
    messages: db.listMessages(id),
  };
}

// settings
on("GET", "/settings", () => ({ storyQuality: db.getSetting("story_quality") || "default", responseLength: db.getSetting("response_length") || "medium", storage: db.storageKind(), ai: aiAvailable() }));
on("PUT", "/settings", (_m, b) => {
  if (b.storyQuality === "default" || b.storyQuality === "complex") db.setSetting("story_quality", b.storyQuality);
  if (["short", "medium", "long"].includes(String(b.responseLength))) db.setSetting("response_length", String(b.responseLength));
  return { ok: true };
});

// characters
on("GET", "/characters", () => db.listCharacters());
on("GET", "/characters/:id", (m) => db.getCharacter(m[1]) ?? notFound("Character"));
on("POST", "/characters", (_m, b) => db.saveCharacter({ ...b, id: undefined }));
on("PUT", "/characters/:id", (m, b) => db.saveCharacter({ ...b, id: m[1] }));
on("POST", "/characters/:id/duplicate", (m) => {
  const c = db.getCharacter(m[1]) ?? notFound("Character");
  return db.saveCharacter({ ...c, id: undefined, name: `${c.name} (copy)` });
});
on("DELETE", "/characters/:id", (m) => (db.deleteCharacter(m[1]), { ok: true }));

// personas
on("GET", "/personas", () => db.listPersonas());
on("POST", "/personas", (_m, b) => db.savePersona({ ...b, id: undefined }));
on("PUT", "/personas/:id", (m, b) => db.savePersona({ ...b, id: m[1] }));
on("DELETE", "/personas/:id", (m) => (db.deletePersona(m[1]), { ok: true }));

// plots
on("GET", "/plots", () => db.listPlots());
on("GET", "/plots/:id", (m) => {
  const plot = db.getPlot(m[1]) ?? notFound("Plot");
  return { ...plot, characters: db.getPlotCharacters(plot.id), sessions: db.listSessions(plot.id) };
});
on("POST", "/plots", (_m, b) => db.savePlot({ ...b, id: undefined }));
on("PUT", "/plots/:id", (m, b) => db.savePlot({ ...b, id: m[1] }));
on("POST", "/plots/:id/duplicate", (m) => db.duplicatePlot(m[1]) ?? notFound("Plot"));
on("DELETE", "/plots/:id", async (m) => {
  for (const s of db.listSessions(m[1])) await db.ensureSession(s.id);
  db.deletePlot(m[1]);
  return { ok: true };
});

// sessions
on("POST", "/plots/:id/sessions", (m, b) => createSession(m[1], b.title as string | undefined));
on("GET", "/sessions/:id", async (m) => {
  await db.ensureSession(m[1]);
  return sessionPayload(m[1]) ?? notFound("Story");
});
on("PUT", "/sessions/:id", (m, b) => {
  db.updateSession(m[1], {
    title: typeof b.title === "string" && b.title.trim() ? b.title.trim() : undefined,
    speaker_mode: b.speaker_mode === "manual" || b.speaker_mode === "auto" ? b.speaker_mode : undefined,
    intelligence: b.intelligence === "advanced" || b.intelligence === "normal" ? b.intelligence : undefined,
  });
  return db.getSession(m[1]);
});
on("POST", "/sessions/:id/duplicate", async (m, b) => {
  await db.ensureSession(m[1]);
  return db.duplicateSession(m[1], b.title as string | undefined) ?? notFound("Story");
});
on("DELETE", "/sessions/:id", async (m) => {
  await db.ensureSession(m[1]);
  db.deleteSession(m[1]);
  return { ok: true };
});
on("GET", "/sessions/:id/search", async (m, _b, q) => {
  await db.ensureSession(m[1]);
  const text = (q.get("q") ?? "").trim();
  return text ? db.searchMessages(m[1], text) : [];
});

// messages
on("PUT", "/messages/:id", async (m, b) => {
  const msg = db.getMessage(m[1]) ?? notFound("Message");
  const content = String(b.content ?? "").trim();
  if (!content) throw new LocalError(400, "Message can't be empty.");
  return withSessionLock(msg.session_id, async () => {
    db.updateMessage(msg.id, { content });
    return msg.kind === "user" ? reinterpretUserMessage(msg.session_id, msg.id) : db.getMessage(msg.id);
  });
});
on("DELETE", "/messages/:id", async (m) => {
  const msg = db.getMessage(m[1]);
  if (msg) await withSessionLock(msg.session_id, async () => db.deleteMessage(msg.id));
  return { ok: true };
});

// memory & state
on("GET", "/sessions/:id/memory", async (m) => {
  await db.ensureSession(m[1]);
  const s = db.getSession(m[1]) ?? notFound("Story");
  return { state: s.state, summary: s.summary, memories: db.listMemories(s.id) };
});
on("PUT", "/sessions/:id/state", async (m, b) => {
  await withSessionLock(m[1], async () => {
    const incoming = b.state as SessionState | undefined;
    const patch: Parameters<typeof db.updateSession>[1] = {};
    if (incoming?.scene) {
      patch.state = {
        scene: {
          location: String(incoming.scene.location ?? ""), time: String(incoming.scene.time ?? ""),
          description: String(incoming.scene.description ?? ""), present: (incoming.scene.present ?? []).map(String),
        },
        characters: Object.fromEntries(Object.entries(incoming.characters ?? {}).map(([k, v]) => [k, { ...emptyCharacterState(), ...v }])),
        threads: (incoming.threads ?? []).map(String),
      };
    }
    if (typeof b.summary === "string") patch.summary = b.summary;
    db.updateSession(m[1], patch);
  });
  return { ok: true };
});
on("POST", "/sessions/:id/memories", (m, b) => {
  if (!String(b.content ?? "").trim()) throw new LocalError(400, "Memory text is empty.");
  return db.insertMemory({ session_id: m[1], kind: String(b.kind || "event"), content: String(b.content).trim(), importance: Number(b.importance) || 3, known_by: Array.isArray(b.known_by) ? b.known_by.map(String) : [], pinned: !!b.pinned, turn_id: null });
});
on("PUT", "/memories/:id", (m, b) => {
  db.updateMemory(m[1], {
    content: typeof b.content === "string" ? b.content : undefined,
    importance: b.importance !== undefined ? Math.max(1, Math.min(5, Number(b.importance))) : undefined,
    known_by: Array.isArray(b.known_by) ? b.known_by.map(String) : undefined,
    pinned: typeof b.pinned === "boolean" ? b.pinned : undefined,
  });
  return db.getMemory(m[1]);
});
on("DELETE", "/memories/:id", (m) => (db.deleteMemory(m[1]), { ok: true }));

function notFound(what: string): never {
  throw new LocalError(404, `${what} not found.`);
}

export async function handle(method: string, fullPath: string, body: Body = {}): Promise<unknown> {
  await boot();
  const [path, qs] = fullPath.split("?");
  for (const [m, re, h] of routes) {
    if (m !== method) continue;
    const match = path.match(re);
    if (match) return JSON.parse(JSON.stringify((await h(match, body, new URLSearchParams(qs ?? ""))) ?? null));
  }
  throw new LocalError(404, `Unknown action ${method} ${path}`);
}

/** Run a story turn in the page; events stream straight into the UI. */
export async function turn(sessionId: string, body: { action: "send" | "continue" | "regenerate"; text?: string; speakers?: string[] }, onEvent: (e: TurnEvent) => void, signal: AbortSignal) {
  await boot();
  await db.ensureSession(sessionId);
  let done = false;
  const emit = (e: TurnEvent) => {
    if (done) return;
    if (e.type === "done") done = true;
    onEvent(e);
  };
  try {
    await runTurn({ sessionId, action: body.action, text: body.text, speakers: body.speakers, signal, emit });
  } catch (e) {
    const text = e instanceof MissingCredentialsError ? e.message : `Something went wrong: ${(e as Error).message}`;
    emit({ type: "error", text });
    emit({ type: "done" });
  } finally {
    void db.flush();
  }
}

/** Store an image: in the Artifact's file storage when available, otherwise as a small inline picture. */
export async function storeImage(blob: Blob, smallDataUrl: string): Promise<string> {
  const assets = await useCap<{ upload(b: Blob): Promise<{ id: string }> }>("assets");
  if (assets) {
    try {
      const r = await assets.upload(blob);
      return "/_blob/" + r.id;
    } catch {
      /* fall back below */
    }
  }
  return smallDataUrl;
}
