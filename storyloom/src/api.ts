export interface Character {
  id: string; name: string; avatar: string | null; images: string[]; tagline: string; appearance: string;
  personality: string; intelligence: string; background: string; speaking_style: string; emotional_tendencies: string;
  motivations: string; values_boundaries: string; fears: string; relationships: string; relationship_to_user: string;
  secrets: string; example_dialogue: string; instructions: string; created_at: string; updated_at: string;
}
export interface Persona {
  id: string; name: string; avatar: string | null; appearance: string; background: string; personality: string;
  role: string; relationships: string; instructions: string;
}
export interface PlotCharacter { character_id: string; role_note: string; starts_present: boolean; sort: number }
export interface Plot {
  id: string; title: string; cover: string | null; description: string; setting: string; lore: string; scenario: string;
  start_location: string; persona_id: string | null; created_at: string; updated_at: string;
  character_ids?: string[]; session_count?: number; last_played?: string | null;
}
export interface CharacterState {
  mood: string; goals: string[]; plans: string[]; intentions: string; beliefs: string[]; trust_user: number;
  affection_user: number; user_view: string; relationships: Record<string, string>; perspective_summary: string;
}
export interface SessionState {
  scene: { location: string; time: string; description: string; present: string[] };
  characters: Record<string, CharacterState>;
  threads: string[];
}
export interface Session {
  id: string; plot_id: string; title: string; speaker_mode: "auto" | "manual"; intelligence: "normal" | "advanced";
  state: SessionState; summary: string; summarized_upto: number;
  usage: { input_tokens?: number; output_tokens?: number; cost_usd?: number; calls?: number };
  created_at: string; updated_at: string; message_count?: number; last_message?: string | null;
}
export interface Message {
  id: string; session_id: string; seq: number; kind: "user" | "character" | "narration"; character_id: string | null;
  content: string; perceived: string | null; private_note: string | null; witnesses: string[]; turn_id: string | null; created_at: string;
}
export interface Memory {
  id: string; session_id: string; kind: string; content: string; importance: number; known_by: string[]; pinned: boolean;
  turn_id: string | null; created_at: string;
}
export interface ModelInfo { id: string; label: string; input: number; output: number; note: string }
export interface Settings {
  storyModel: string; helperModel: string; responseLength: "short" | "medium" | "long"; models: ModelInfo[];
  apiKeyConfigured: boolean; apiKeySource: "environment" | "settings" | null; apiKeyHint: string | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export let onUnauthorized: () => void = () => {};
export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
  });
  if (res.status === 401 && !path.startsWith("/login")) onUnauthorized();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Resize in the browser (keeps uploads small and fast on mobile data), then upload. */
export async function uploadImage(file: File, maxSize = 1280): Promise<string> {
  const dataUrl = await resizeImage(file, maxSize);
  const r = await api<{ url: string }>("/upload", { body: { dataUrl } });
  return r.url;
}

async function resizeImage(file: File, maxSize: number): Promise<string> {
  if (file.type === "image/gif") return readAsDataUrl(file);
  const src = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Could not read that image."));
    i.src = src;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export type TurnEvent =
  | { type: "status"; text: string }
  | { type: "user_message"; message: Message }
  | { type: "message_updated"; message: Message }
  | { type: "removed"; ids: string[] }
  | { type: "beat_start"; key: string; speaker: string }
  | { type: "delta"; key: string; text: string }
  | { type: "beat_end"; key: string; message: Message | null }
  | { type: "notice"; text: string }
  | { type: "error"; text: string }
  | { type: "done" };

/** POST a turn and read the newline-delimited JSON event stream. */
export async function streamTurn(
  sessionId: string,
  body: { action: "send" | "continue" | "regenerate"; text?: string; speakers?: string[] },
  onEvent: (e: TurnEvent) => void,
  signal: AbortSignal,
) {
  const res = await fetch(`/api/sessions/${sessionId}/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (res.status === 401) {
    onUnauthorized();
    return;
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as TurnEvent);
    }
  }
}
