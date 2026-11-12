// Browser twin of server/llm/provider.ts. Inside a Claude Artifact the AI runs on the viewer's
// own Claude account through the `sample` capability: no API key, no separate bill.
import { getSetting } from "./db.ts";
import { useCap } from "./storage.ts";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
export interface LLMUsage { input_tokens: number; output_tokens: number; cache_read_tokens: number; cache_write_tokens: number; model: string }
export interface LLMRequest { model: string; system: { stable: string; volatile?: string }; user: string; effort: Effort; maxTokens: number; signal?: AbortSignal }
export interface LLMTextResult { text: string; usage: LLMUsage; refused: boolean; truncated: boolean }
export interface LLMProvider {
  name: string;
  streamText(req: LLMRequest, onDelta: (chunk: string) => void): Promise<LLMTextResult>;
  json<T>(req: LLMRequest & { schema: Record<string, unknown> }): Promise<{ data: T; usage: LLMUsage }>;
}

export class MissingCredentialsError extends Error {
  constructor() {
    super("Claude isn't available here. Open Storyloom as an Artifact inside Claude (claude.ai or the Claude app).");
  }
}

type SampleFn = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string; truncated: boolean }>) & {
  json: <T>(input: string, opts?: Record<string, unknown>) => Promise<T>;
};
let sample: SampleFn | null = null;
let ready: Promise<void> | null = null;
export function initProvider(): Promise<void> {
  ready ??= useCap<SampleFn>("sample").then((s) => { sample = s; });
  return ready;
}
export function aiAvailable() {
  return !!sample;
}

let testProvider: LLMProvider | null = null;
export function setTestProvider(p: LLMProvider | null) {
  testProvider = p;
}

const zero = (model: string): LLMUsage => ({ input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, model });

/** Story turns follow the quality setting; helper work stays light. */
function route(req: LLMRequest): { modelTier: "default" | "complex"; effort: "low" | "medium" | "high" } {
  const deep = req.effort === "high" || req.effort === "xhigh" || req.effort === "max";
  if (req.model === "helper") return { modelTier: "default", effort: req.effort === "low" ? "low" : "medium" };
  if (req.model === "complex") return { modelTier: "complex", effort: deep ? "high" : req.effort === "medium" ? "medium" : "low" };
  return deep ? { modelTier: "complex", effort: "high" } : { modelTier: "default", effort: req.effort === "medium" ? "medium" : "low" };
}

function prompt(req: LLMRequest): string {
  return [req.system.stable, req.system.volatile ?? "", "=====", req.user].filter(Boolean).join("\n\n");
}

interface SampleError { code?: string; message?: string; text?: string }
function friendly(e: SampleError): Error {
  const map: Record<string, string> = {
    not_granted: "Storyloom needs permission to use Claude. Reload and choose Allow when asked.",
    sampling_disabled: "Claude isn't available for this account right now.",
    rate_limited: "You've hit a Claude usage limit for now. Wait a bit, then try again.",
    session_expired: "Please sign in to Claude again.",
    prompt_too_large: "This story's context got too large. Shorten the lore or some memories.",
    upstream_error: "Claude had a temporary problem. Try again.",
  };
  return new Error(map[e.code ?? ""] ?? e.message ?? "Claude request failed.");
}

class SampleProvider implements LLMProvider {
  name = "claude-artifact";
  constructor(private s: SampleFn) {}
  async streamText(req: LLMRequest, onDelta: (chunk: string) => void): Promise<LLMTextResult> {
    let seen = "";
    try {
      const r = await this.s(prompt(req), {
        ...route(req), cache: false, signal: req.signal,
        onText: ({ text, delta }: { text: string; delta: string }) => {
          seen = text;
          onDelta(delta);
        },
      });
      return { text: r.text, usage: zero(req.model), refused: false, truncated: r.truncated };
    } catch (raw) {
      const e = raw as SampleError;
      if (e.code === "refused") return { text: "", usage: zero(req.model), refused: true, truncated: false };
      if (e.code === "cancelled") throw Object.assign(new Error("cancelled"), { partial: e.text ?? seen });
      if (e.code === "empty_completion") return { text: "", usage: zero(req.model), refused: false, truncated: false };
      throw friendly(e);
    }
  }
  async json<T>(req: LLMRequest & { schema: Record<string, unknown> }): Promise<{ data: T; usage: LLMUsage }> {
    const p = `${prompt(req)}\n\nReply with ONLY one JSON value (no prose, no code fence) that matches this JSON Schema exactly — every listed field present:\n${JSON.stringify(req.schema)}`;
    try {
      const data = await this.s.json<T>(p, { ...route(req), cache: false, signal: req.signal });
      return { data, usage: zero(req.model) };
    } catch (raw) {
      throw friendly(raw as SampleError);
    }
  }
}

export function getProvider(): LLMProvider {
  if (testProvider) return testProvider;
  if (!sample) throw new MissingCredentialsError();
  return new SampleProvider(sample);
}

export function getApiKey(): string | undefined {
  return undefined;
}

export interface ModelSettings { storyModel: string; helperModel: string; maxResponseTokens: number }
export function getModelSettings(): ModelSettings {
  return { storyModel: getSetting("story_quality") === "complex" ? "complex" : "default", helperModel: "helper", maxResponseTokens: 0 };
}
export function estimateCost(_u: LLMUsage): number {
  return 0;
}
