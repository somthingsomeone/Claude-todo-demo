// Provider-neutral interface. Anthropic is the built-in provider; others can be added
// by implementing LLMProvider and registering it in getProvider().
import { getSetting } from "../db.ts";
import { AnthropicProvider } from "./anthropic.ts";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface LLMUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  model: string;
}

export interface LLMRequest {
  model: string;
  /** stable part first (cached), volatile part second */
  system: { stable: string; volatile?: string };
  /** a single user turn is enough for this app: we render transcripts ourselves */
  user: string;
  effort: Effort;
  maxTokens: number;
  signal?: AbortSignal;
}

export interface LLMTextResult {
  text: string;
  usage: LLMUsage;
  refused: boolean;
  truncated: boolean;
}

export interface LLMProvider {
  name: string;
  /** Stream plain text. onDelta receives text chunks. */
  streamText(req: LLMRequest, onDelta: (chunk: string) => void): Promise<LLMTextResult>;
  /** Return JSON that matches `schema` (structured output). */
  json<T>(req: LLMRequest & { schema: Record<string, unknown> }): Promise<{ data: T; usage: LLMUsage }>;
}

export class MissingCredentialsError extends Error {
  constructor() {
    super("No Anthropic API key is configured. Open Settings and paste your key (or set ANTHROPIC_API_KEY on the server).");
  }
}

let testProvider: LLMProvider | null = null;
/** Automated tests inject a scripted provider here. Never used by the real app. */
export function setTestProvider(p: LLMProvider | null) {
  testProvider = p;
}

export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key") || undefined;
}

export function getProvider(): LLMProvider {
  if (testProvider) return testProvider;
  const key = getApiKey();
  if (!key) throw new MissingCredentialsError();
  return new AnthropicProvider(key);
}

// ---------- model settings ----------
export interface ModelInfo { id: string; label: string; input: number; output: number; cacheRead: number; note: string }

/** Prices in USD per million tokens (Anthropic list prices, Nov 2026). */
export const MODELS: ModelInfo[] = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", input: 4, output: 20, cacheRead: 0.2, note: "Recommended. Strongest reasoning for believable, intelligent characters." },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", input: 2, output: 10, cacheRead: 0.1, note: "About half the cost of Opus. Good everyday quality." },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", input: 0.1, output: 0.5, cacheRead: 0.01, note: "Very cheap and fast. Fine for the helper; weaker as the storyteller." },
  { id: "claude-fable-5-2", label: "Claude Fable 5.2", input: 8, output: 40, cacheRead: 0.2, note: "Anthropic's most capable model. Twice the price of Opus; slower." },
];

export interface ModelSettings {
  storyModel: string;
  helperModel: string;
  maxResponseTokens: number;
}

export function getModelSettings(): ModelSettings {
  return {
    storyModel: getSetting("story_model") || "claude-opus-5-5",
    helperModel: getSetting("helper_model") || "claude-opus-5-5",
    maxResponseTokens: Number(getSetting("max_response_tokens") || 1200),
  };
}

export function estimateCost(u: LLMUsage): number {
  const m = MODELS.find((x) => x.id === u.model) ?? MODELS[0];
  const cacheWrite = m.input * 1.25;
  return (u.input_tokens * m.input + u.output_tokens * m.output + u.cache_read_tokens * m.cacheRead + u.cache_write_tokens * cacheWrite) / 1_000_000;
}
