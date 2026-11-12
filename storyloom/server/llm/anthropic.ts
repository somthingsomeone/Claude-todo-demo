import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMRequest, LLMTextResult, LLMUsage } from "./provider.ts";

/** Models that accept the server-side refusal fallback ("fallbacks: default"). */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-fable-5-2", "claude-fable-5-1", "claude-opus-5"]);

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    // baseURL is pinned so a stray ANTHROPIC_BASE_URL in the host environment can't redirect the key.
    this.client = new Anthropic({ apiKey, baseURL: process.env.STORYLOOM_ANTHROPIC_BASE_URL || "https://api.anthropic.com", maxRetries: 2 });
  }

  private params(req: LLMRequest) {
    const system: Anthropic.Beta.BetaTextBlockParam[] = [
      { type: "text", text: req.system.stable, cache_control: { type: "ephemeral" } },
    ];
    if (req.system.volatile) system.push({ type: "text", text: req.system.volatile });
    const useFallback = FALLBACK_MODELS.has(req.model);
    return {
      model: req.model,
      max_tokens: req.maxTokens,
      system,
      messages: [{ role: "user" as const, content: req.user }],
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    };
  }

  async streamText(req: LLMRequest, onDelta: (chunk: string) => void): Promise<LLMTextResult> {
    const stream = this.client.beta.messages.stream(
      { ...this.params(req), output_config: { effort: req.effort } },
      { signal: req.signal },
    );
    stream.on("text", (t) => onDelta(t));
    const msg = await stream.finalMessage();
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return { text, usage: usageOf(msg), refused: msg.stop_reason === "refusal", truncated: msg.stop_reason === "max_tokens" };
  }

  async json<T>(req: LLMRequest & { schema: Record<string, unknown> }): Promise<{ data: T; usage: LLMUsage }> {
    const stream = this.client.beta.messages.stream(
      {
        ...this.params(req),
        output_config: { effort: req.effort, format: { type: "json_schema", schema: req.schema } },
      },
      { signal: req.signal },
    );
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new Error("The model declined this request.");
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(msg.stop_reason === "max_tokens" ? "Structured response was cut off (max tokens)." : "Structured response was not valid JSON.");
    }
    return { data, usage: usageOf(msg) };
  }
}

function usageOf(msg: Anthropic.Beta.BetaMessage): LLMUsage {
  const u = msg.usage;
  return {
    input_tokens: u.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? 0,
    cache_read_tokens: u.cache_read_input_tokens ?? 0,
    cache_write_tokens: u.cache_creation_input_tokens ?? 0,
    model: msg.model,
  };
}
