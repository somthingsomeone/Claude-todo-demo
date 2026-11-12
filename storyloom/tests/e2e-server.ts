// TEST ONLY: runs the real app with a scripted AI so the UI can be exercised without an API key.
// Not used by `npm start`; the real app always calls Anthropic.
import { setTestProvider, type LLMProvider, type LLMRequest } from "../server/llm/provider.ts";

const u = () => ({ input_tokens: 1000, output_tokens: 200, cache_read_tokens: 0, cache_write_tokens: 0, model: "claude-opus-5-5" });
const provider: LLMProvider = {
  name: "e2e",
  async streamText(req: LLMRequest, onDelta) {
    const who = /YOU PLAY: (.+)/.exec(req.system.stable)?.[1];
    const text = who ? `*${who} studies you for a long moment.* [test reply from ${who}] You ask a great deal for a stranger.` : "The lanterns gutter as a cold draft moves through the hall. [test narration]";
    for (const w of text.split(/(?<= )/)) { await new Promise((r) => setTimeout(r, 90)); onDelta(w); }
    return { text, usage: u(), refused: false, truncated: false };
  },
  async json<T>(req: LLMRequest & { schema: Record<string, unknown> }) {
    const required = req.schema.required as string[];
    const ids = [...req.system.volatile!.matchAll(/id=(\S+) \| ([^[|]+)\[PRESENT\]/g)].map((m) => m[1]);
    if (required.includes("beats")) {
      const raw = /<<<\n([\s\S]*?)\n>>>/.exec(req.user)?.[1] ?? "";
      const beats = ids.slice(0, 2).map((id, i) => ({ speaker: id, direction: "", enters: false, complex: i === 0 }));
      return { data: { segments: [], perceived: raw.replace(/I think[^.*]*\.?/i, "").trim(), private_note: /I think[^.*]*/i.exec(raw)?.[0] ?? "", addressed: [], beats: beats.length ? beats : [{ speaker: "narrator", direction: "", enters: false, complex: false }] } as T, usage: u() };
    }
    if (required.includes("outline")) return { data: { outline: "", perspectives: [] } as T, usage: u() };
    return { data: { scene: { location: "Audience hall", time: "Night", description: "Snow outside", present: ids }, characters: [], memories: [{ content: "The stranger arrived at court.", importance: 3, known_by: ids, kind: "event" }], threads: ["Who sent the stranger?"] } as T, usage: u() };
  },
};
setTestProvider(provider);
await import("../server/index.ts");
