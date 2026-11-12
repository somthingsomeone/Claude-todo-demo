import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import * as db from "./db.ts";
import { isLoggedIn, login, logout, authRequired, requireAuth } from "./auth.ts";
import { getApiKey, getModelSettings, MissingCredentialsError, MODELS } from "./llm/provider.ts";
import { createSession } from "./engine/session.ts";
import { reinterpretUserMessage, runTurn, withSessionLock, type TurnEvent } from "./engine/turn.ts";
import { emptyCharacterState, type SessionState } from "./engine/types.ts";

export const api = express.Router();

const p = (req: Request, name: string) => String(req.params[name]);

api.get("/auth", (req, res) => res.json({ loggedIn: isLoggedIn(req), required: authRequired() }));
api.post("/login", login);
api.post("/logout", logout);

api.use(requireAuth);

// ---------- uploads (images are resized in the browser before upload) ----------
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
api.post("/upload", express.json({ limit: "12mb" }), (req, res) => {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/s.exec(String(req.body?.dataUrl ?? ""));
  if (!m || !IMAGE_TYPES[m[1]]) return res.status(400).json({ error: "Please choose a JPG, PNG, WebP or GIF image." });
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: "Image is too large (max 8 MB)." });
  const name = `${db.newId()}.${IMAGE_TYPES[m[1]]}`;
  fs.writeFileSync(path.join(db.UPLOAD_DIR, name), buf);
  res.json({ url: `/files/${name}` });
});

// ---------- settings ----------
api.get("/settings", (_req, res) => {
  const key = getApiKey();
  res.json({
    ...getModelSettings(),
    responseLength: db.getSetting("response_length") || "medium",
    models: MODELS,
    apiKeyConfigured: !!key,
    apiKeySource: process.env.ANTHROPIC_API_KEY ? "environment" : key ? "settings" : null,
    apiKeyHint: key ? `…${key.slice(-4)}` : null,
  });
});
api.put("/settings", (req, res) => {
  const b = req.body ?? {};
  const valid = new Set(MODELS.map((m) => m.id));
  if (b.storyModel && valid.has(b.storyModel)) db.setSetting("story_model", b.storyModel);
  if (b.helperModel && valid.has(b.helperModel)) db.setSetting("helper_model", b.helperModel);
  if (["short", "medium", "long"].includes(b.responseLength)) db.setSetting("response_length", b.responseLength);
  if (typeof b.apiKey === "string") db.setSetting("anthropic_api_key", b.apiKey.trim() || null);
  res.json({ ok: true });
});

// ---------- characters ----------
api.get("/characters", (_req, res) => res.json(db.listCharacters()));
api.get("/characters/:id", (req, res) => {
  const c = db.getCharacter(p(req, "id"));
  c ? res.json(c) : res.status(404).json({ error: "Character not found." });
});
api.post("/characters", (req, res) => res.json(db.saveCharacter({ ...req.body, id: undefined })));
api.put("/characters/:id", (req, res) => res.json(db.saveCharacter({ ...req.body, id: p(req, "id") })));
api.post("/characters/:id/duplicate", (req, res) => {
  const c = db.getCharacter(p(req, "id"));
  if (!c) return res.status(404).json({ error: "Character not found." });
  res.json(db.saveCharacter({ ...c, id: undefined, name: `${c.name} (copy)` }));
});
api.delete("/characters/:id", (req, res) => {
  db.deleteCharacter(p(req, "id"));
  res.json({ ok: true });
});

// ---------- personas ----------
api.get("/personas", (_req, res) => res.json(db.listPersonas()));
api.post("/personas", (req, res) => res.json(db.savePersona({ ...req.body, id: undefined })));
api.put("/personas/:id", (req, res) => res.json(db.savePersona({ ...req.body, id: p(req, "id") })));
api.delete("/personas/:id", (req, res) => {
  db.deletePersona(p(req, "id"));
  res.json({ ok: true });
});

// ---------- plots ----------
api.get("/plots", (_req, res) => res.json(db.listPlots()));
api.get("/plots/:id", (req, res) => {
  const plot = db.getPlot(p(req, "id"));
  if (!plot) return res.status(404).json({ error: "Plot not found." });
  res.json({ ...plot, characters: db.getPlotCharacters(plot.id), sessions: db.listSessions(plot.id) });
});
api.post("/plots", (req, res) => res.json(db.savePlot({ ...req.body, id: undefined })));
api.put("/plots/:id", (req, res) => res.json(db.savePlot({ ...req.body, id: p(req, "id") })));
api.post("/plots/:id/duplicate", (req, res) => {
  const plot = db.duplicatePlot(p(req, "id"));
  plot ? res.json(plot) : res.status(404).json({ error: "Plot not found." });
});
api.delete("/plots/:id", (req, res) => {
  db.deletePlot(p(req, "id"));
  res.json({ ok: true });
});

// ---------- sessions (save slots) ----------
api.post("/plots/:id/sessions", (req, res) => {
  try {
    res.json(createSession(p(req, "id"), req.body?.title));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

function sessionPayload(id: string) {
  const s = db.getSession(id);
  if (!s) return undefined;
  const plot = db.getPlot(s.plot_id)!;
  const castIds = db.getPlotCharacters(plot.id).map((c) => c.character_id);
  return {
    session: s,
    plot,
    persona: db.getPersona(plot.persona_id) ?? null,
    cast: castIds.map((cid) => db.getCharacter(cid)).filter(Boolean),
    messages: db.listMessages(id),
  };
}

api.get("/sessions/:id", (req, res) => {
  const payload = sessionPayload(p(req, "id"));
  payload ? res.json(payload) : res.status(404).json({ error: "Story not found." });
});
api.put("/sessions/:id", (req, res) => {
  const b = req.body ?? {};
  db.updateSession(p(req, "id"), {
    title: typeof b.title === "string" && b.title.trim() ? b.title.trim() : undefined,
    speaker_mode: b.speaker_mode === "manual" || b.speaker_mode === "auto" ? b.speaker_mode : undefined,
    intelligence: b.intelligence === "advanced" || b.intelligence === "normal" ? b.intelligence : undefined,
  });
  res.json(db.getSession(p(req, "id")));
});
api.post("/sessions/:id/duplicate", (req, res) => {
  const s = db.duplicateSession(p(req, "id"), req.body?.title);
  s ? res.json(s) : res.status(404).json({ error: "Story not found." });
});
api.delete("/sessions/:id", (req, res) => {
  db.deleteSession(p(req, "id"));
  res.json({ ok: true });
});
api.get("/sessions/:id/search", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  res.json(q ? db.searchMessages(p(req, "id"), q) : []);
});

// The story turn: streamed back as newline-delimited JSON events.
api.post("/sessions/:id/turn", async (req: Request, res: Response) => {
  const sessionId = p(req, "id");
  if (!db.getSession(sessionId)) return res.status(404).json({ error: "Story not found." });
  const action = ["send", "continue", "regenerate"].includes(req.body?.action) ? req.body.action : "send";
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  let ended = false;
  const emit = (e: TurnEvent) => {
    if (ended) return;
    res.write(JSON.stringify(e) + "\n");
    if (e.type === "done") {
      ended = true;
      res.end();
    }
  };
  try {
    await runTurn({
      sessionId, action, text: req.body?.text, speakers: Array.isArray(req.body?.speakers) ? req.body.speakers : undefined,
      signal: controller.signal, emit,
    });
  } catch (e) {
    const text = e instanceof MissingCredentialsError ? e.message : `Something went wrong: ${(e as Error).message}`;
    emit({ type: "error", text });
    emit({ type: "done" });
  }
});

// ---------- messages ----------
api.put("/messages/:id", async (req, res) => {
  const m = db.getMessage(p(req, "id"));
  if (!m) return res.status(404).json({ error: "Message not found." });
  const content = String(req.body?.content ?? "").trim();
  if (!content) return res.status(400).json({ error: "Message can't be empty." });
  const updated = await withSessionLock(m.session_id, async () => {
    db.updateMessage(m.id, { content });
    return m.kind === "user" ? reinterpretUserMessage(m.session_id, m.id) : db.getMessage(m.id);
  });
  res.json(updated);
});
api.delete("/messages/:id", async (req, res) => {
  const m = db.getMessage(p(req, "id"));
  if (!m) return res.json({ ok: true });
  await withSessionLock(m.session_id, async () => db.deleteMessage(m.id));
  res.json({ ok: true });
});

// ---------- memory & state inspection ----------
api.get("/sessions/:id/memory", (req, res) => {
  const s = db.getSession(p(req, "id"));
  if (!s) return res.status(404).json({ error: "Story not found." });
  res.json({ state: s.state, summary: s.summary, memories: db.listMemories(s.id) });
});
api.put("/sessions/:id/state", async (req, res) => {
  const id = p(req, "id");
  await withSessionLock(id, async () => {
    const s = db.getSession(id);
    if (!s) return;
    const incoming = req.body?.state as SessionState | undefined;
    const patch: Parameters<typeof db.updateSession>[1] = {};
    if (incoming?.scene) {
      const next: SessionState = {
        scene: {
          location: String(incoming.scene.location ?? ""), time: String(incoming.scene.time ?? ""),
          description: String(incoming.scene.description ?? ""), present: (incoming.scene.present ?? []).map(String),
        },
        characters: Object.fromEntries(Object.entries(incoming.characters ?? {}).map(([k, v]) => [k, { ...emptyCharacterState(), ...v }])),
        threads: (incoming.threads ?? []).map(String),
      };
      patch.state = next;
    }
    if (typeof req.body?.summary === "string") patch.summary = req.body.summary;
    db.updateSession(id, patch);
  });
  res.json({ ok: true });
});
api.post("/sessions/:id/memories", (req, res) => {
  const b = req.body ?? {};
  if (!String(b.content ?? "").trim()) return res.status(400).json({ error: "Memory text is empty." });
  res.json(db.insertMemory({ session_id: p(req, "id"), kind: b.kind || "event", content: String(b.content).trim(), importance: Number(b.importance) || 3, known_by: Array.isArray(b.known_by) ? b.known_by : [], pinned: !!b.pinned, turn_id: null }));
});
api.put("/memories/:id", (req, res) => {
  const b = req.body ?? {};
  db.updateMemory(p(req, "id"), {
    content: typeof b.content === "string" ? b.content : undefined,
    importance: b.importance !== undefined ? Math.max(1, Math.min(5, Number(b.importance))) : undefined,
    known_by: Array.isArray(b.known_by) ? b.known_by.map(String) : undefined,
    pinned: typeof b.pinned === "boolean" ? b.pinned : undefined,
  });
  res.json(db.getMemory(p(req, "id")));
});
api.delete("/memories/:id", (req, res) => {
  db.deleteMemory(p(req, "id"));
  res.json({ ok: true });
});
