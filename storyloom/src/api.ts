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
export interface Settings {
  storyQuality: "default" | "complex"; responseLength: "short" | "medium" | "long"; storage: "claude" | "browser"; ai: boolean;
}

import * as local from "./local/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const method = init?.method ?? (init?.body !== undefined ? "POST" : "GET");
  try {
    return (await local.handle(method, path, (init?.body as Record<string, unknown>) ?? {})) as T;
  } catch (e) {
    if (e instanceof local.LocalError) throw new ApiError(e.status, e.message);
    throw e;
  }
}

/** Resize in the browser (keeps storage small), then store. */
export async function uploadImage(file: File, maxSize = 1280): Promise<string> {
  const img = await loadImage(file);
  const big = await toBlob(img, maxSize);
  const small = toCanvas(img, 320).toDataURL("image/jpeg", 0.8);
  return local.storeImage(big, small);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Could not read that image."));
    i.src = url;
  });
}
function toCanvas(img: HTMLImageElement, maxSize: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
function toBlob(img: HTMLImageElement, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => toCanvas(img, maxSize).toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process that image."))), "image/jpeg", 0.88));
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

export async function streamTurn(
  sessionId: string,
  body: { action: "send" | "continue" | "regenerate"; text?: string; speakers?: string[] },
  onEvent: (e: TurnEvent) => void,
  signal: AbortSignal,
) {
  await local.turn(sessionId, body, (e) => onEvent(JSON.parse(JSON.stringify(e)) as TurnEvent), signal);
}
