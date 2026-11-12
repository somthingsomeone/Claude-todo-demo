import { beforeEach, describe, expect, it } from "vitest";
import * as db from "../server/db.ts";
import { setTestProvider, type LLMProvider, type LLMRequest } from "../server/llm/provider.ts";
import { createSession } from "../server/engine/session.ts";
import { applyChronicle, idle, runTurn, type TurnEvent } from "../server/engine/turn.ts";
import { emptyCharacterState } from "../server/engine/types.ts";

/** Scripted stand-in for the AI, used only by automated tests. Records every prompt it receives. */
class ScriptedProvider implements LLMProvider {
  name = "scripted";
  calls: { kind: string; req: LLMRequest; full: string }[] = [];
  director: (req: LLMRequest) => unknown = () => ({ segments: [], perceived: "", private_note: "", addressed: [], beats: [] });
  chronicler: (req: LLMRequest) => unknown = () => ({ scene: { location: "", time: "", description: "", present: [] }, characters: [], memories: [], threads: [] });
  lines: Record<string, string> = {};

  private record(kind: string, req: LLMRequest) {
    this.calls.push({ kind, req, full: `${req.system.stable}\n${req.system.volatile ?? ""}\n${req.user}` });
  }
  async streamText(req: LLMRequest, onDelta: (c: string) => void) {
    const who = /YOU PLAY: (.+)/.exec(req.system.stable)?.[1] ?? "narrator";
    this.record(`beat:${who}`, req);
    const text = this.lines[who] ?? `*${who} nods.* Fine.`;
    for (const part of text.match(/.{1,8}/gs) ?? []) onDelta(part);
    return { text, usage: usage(), refused: false, truncated: false };
  }
  async json<T>(req: LLMRequest & { schema: Record<string, unknown> }) {
    const req2 = req.schema.required as string[];
    if (req2.includes("beats")) {
      this.record("director", req);
      return { data: this.director(req) as T, usage: usage() };
    }
    if (req2.includes("outline")) {
      this.record("summarizer", req);
      return { data: { outline: "outline", perspectives: [] } as T, usage: usage() };
    }
    this.record("chronicler", req);
    return { data: this.chronicler(req) as T, usage: usage() };
  }
}
const usage = () => ({ input_tokens: 100, output_tokens: 50, cache_read_tokens: 0, cache_write_tokens: 0, model: "claude-opus-5-5" });

let ai: ScriptedProvider;
let kenji: db.CharacterRow, akari: db.CharacterRow, guard: db.CharacterRow;
let plot: db.PlotRow;

async function turn(sessionId: string, action: "send" | "continue" | "regenerate", text?: string, speakers?: string[]) {
  const events: TurnEvent[] = [];
  await runTurn({ sessionId, action, text, speakers, emit: (e) => events.push(e) });
  await idle(sessionId);
  return events;
}

beforeEach(() => {
  db.useMemoryDb();
  ai = new ScriptedProvider();
  setTestProvider(ai);
  kenji = db.saveCharacter({ name: "Kenji", personality: "Proud strategist", secrets: "Plans to poison the regent", appearance: "Tall, grey robes" });
  akari = db.saveCharacter({ name: "Akari", personality: "Suspicious spy", appearance: "Small, sharp eyes" });
  guard = db.saveCharacter({ name: "Guard", personality: "Dutiful" });
  const persona = db.savePersona({ name: "Ren", appearance: "Travel-worn cloak", background: "Secretly an assassin" });
  plot = db.savePlot({
    title: "Shogun Palace", setting: "Edo, 1603", scenario: "Lanterns flicker in the hall.", persona_id: persona.id,
    characters: [
      { character_id: kenji.id, role_note: "", starts_present: true, sort: 0 },
      { character_id: akari.id, role_note: "", starts_present: true, sort: 1 },
      { character_id: guard.id, role_note: "", starts_present: false, sort: 2 },
    ],
  });
});

describe("a story turn", () => {
  it("never shows the user's private thought to any character, even if the director leaks it", async () => {
    const s = createSession(plot.id);
    ai.director = () => ({
      segments: [], private_note: "thinks he looks like an idiot", addressed: [kenji.id],
      perceived: "*Ren walks in.* I think he looks like an idiot. \"Hi, what are you doing here?\"", // a bad, leaky interpretation
      beats: [{ speaker: kenji.id, direction: "answers the stranger", enters: false, complex: true }],
    });
    await turn(s.id, "send", "*I walk into the room and notice a man near the window. I think he looks like an idiot.* Hi, what are you doing here?");
    const beat = ai.calls.find((c) => c.kind === "beat:Kenji")!;
    expect(beat).toBeTruthy();
    expect(beat.full.toLowerCase()).not.toContain("idiot");
    expect(beat.full).toContain("Hi, what are you doing here?");
    // the user's persona background is private to the user too
    expect(beat.full).not.toContain("Secretly an assassin");
    // Kenji's own secret is in Kenji's prompt; nobody else's secret is
    expect(beat.full).toContain("Plans to poison the regent");
    const msgs = db.listMessages(s.id);
    const user = msgs.find((m) => m.kind === "user")!;
    expect(user.private_note).toContain("idiot");
    expect(user.perceived!.toLowerCase()).not.toContain("idiot");
    const reply = msgs.find((m) => m.kind === "character")!;
    expect(reply.character_id).toBe(kenji.id);
  });

  it("a character never sees another character's secrets", async () => {
    const s = createSession(plot.id);
    ai.director = () => ({ segments: [], perceived: '"Hello."', private_note: "", addressed: [], beats: [{ speaker: akari.id, direction: "", enters: false, complex: false }] });
    await turn(s.id, "send", "Hello.");
    const beat = ai.calls.find((c) => c.kind === "beat:Akari")!;
    expect(beat.full).not.toContain("poison");
  });

  it("several characters can respond; silent ones are dropped; attribution is correct", async () => {
    const s = createSession(plot.id);
    ai.lines = { Kenji: "*He folds his arms.* You are late.", Akari: "[silent]" };
    ai.director = () => ({
      segments: [], perceived: '"Sorry."', private_note: "", addressed: [],
      beats: [
        { speaker: kenji.id, direction: "", enters: false, complex: false },
        { speaker: akari.id, direction: "", enters: false, complex: false },
        { speaker: kenji.id, direction: "presses the point", enters: false, complex: false },
      ],
    });
    await turn(s.id, "send", "Sorry.");
    const chars = db.listMessages(s.id).filter((m) => m.kind === "character");
    expect(chars.map((m) => m.character_id)).toEqual([kenji.id, kenji.id]);
    // the second Kenji beat saw his own first line
    const second = ai.calls.filter((c) => c.kind === "beat:Kenji")[1];
    expect(second.req.user).toContain("Kenji (you): *He folds his arms.* You are late.");
  });

  it("absent characters can't act unless they enter, and don't know what happened before", async () => {
    const s = createSession(plot.id);
    ai.director = () => ({ segments: [], perceived: '"The password is crane."', private_note: "", addressed: [], beats: [{ speaker: guard.id, direction: "", enters: false, complex: false }] });
    await turn(s.id, "send", "The password is crane.");
    expect(ai.calls.some((c) => c.kind === "beat:Guard")).toBe(false);

    ai.director = () => ({ segments: [], perceived: '"Guard!"', private_note: "", addressed: [], beats: [{ speaker: guard.id, direction: "hears the shout and comes in", enters: true, complex: false }] });
    await turn(s.id, "send", "Guard!");
    const g = ai.calls.find((c) => c.kind === "beat:Guard")!;
    expect(g.req.user).toContain("Guard!");
    expect(g.req.user).not.toContain("crane");
  });

  it("manual mode uses exactly the chosen speakers", async () => {
    const s = createSession(plot.id);
    db.updateSession(s.id, { speaker_mode: "manual" });
    await turn(s.id, "send", "What do you say, Akari?", [akari.id]);
    expect(ai.calls.some((c) => c.kind === "director")).toBe(false); // nothing private to interpret: no extra call
    const chars = db.listMessages(s.id).filter((m) => m.kind === "character");
    expect(chars.map((m) => m.character_id)).toEqual([akari.id]);
  });

  it("regenerate replaces the last responses and rolls back state", async () => {
    const s = createSession(plot.id);
    ai.director = () => ({ segments: [], perceived: '"Hi."', private_note: "", addressed: [], beats: [{ speaker: kenji.id, direction: "", enters: false, complex: false }] });
    ai.chronicler = () => ({
      scene: { location: "Hall", time: "Night", description: "", present: [kenji.id, akari.id] },
      characters: [{ ...emptyCharacterState(), id: kenji.id, mood: "irritated", trust_user: -2, relationships: [], goals: [], plans: [], beliefs: [] }],
      memories: [{ content: "Ren greeted Kenji.", importance: 2, known_by: [kenji.id, akari.id, guard.id], kind: "conversation" }],
      threads: [],
    });
    await turn(s.id, "send", "Hi.");
    expect(db.getSession(s.id)!.state.characters[kenji.id].mood).toBe("irritated");
    const mems = db.listMemories(s.id);
    expect(mems).toHaveLength(1);
    expect(mems[0].known_by.sort()).toEqual([kenji.id, akari.id].sort()); // the absent guard can't remember it

    ai.lines = { Kenji: "A different answer." };
    ai.chronicler = () => ({ scene: { location: "Hall", time: "Night", description: "", present: [kenji.id, akari.id] }, characters: [], memories: [], threads: [] });
    await turn(s.id, "regenerate");
    const msgs = db.listMessages(s.id);
    expect(msgs.filter((m) => m.kind === "user")).toHaveLength(1);
    expect(msgs.filter((m) => m.kind === "character").map((m) => m.content)).toEqual(["A different answer."]);
    expect(db.listMemories(s.id)).toHaveLength(0);
    expect(db.getSession(s.id)!.state.characters[kenji.id].mood).toBe("");
  });

  it("continue works without a user message", async () => {
    const s = createSession(plot.id);
    ai.director = () => ({ segments: [], perceived: "", private_note: "", addressed: [], beats: [{ speaker: "narrator", direction: "time passes", enters: false, complex: false }] });
    await turn(s.id, "continue");
    const msgs = db.listMessages(s.id);
    expect(msgs[msgs.length - 1].kind).toBe("narration");
  });
});

describe("saves and plots stay separate", () => {
  it("a branch is independent from the original", async () => {
    const s = createSession(plot.id);
    ai.director = () => ({ segments: [], perceived: '"Hi."', private_note: "", addressed: [], beats: [{ speaker: kenji.id, direction: "", enters: false, complex: false }] });
    await turn(s.id, "send", "Hi.");
    const branch = db.duplicateSession(s.id, "Alternate")!;
    expect(db.listMessages(branch.id)).toHaveLength(db.listMessages(s.id).length);
    await turn(branch.id, "send", "Only in the branch.");
    expect(db.listMessages(s.id).some((m) => m.content === "Only in the branch.")).toBe(false);
    // regenerate in the branch uses the branch's own snapshot
    await turn(branch.id, "regenerate");
    expect(db.listMessages(branch.id).some((m) => m.content === "Only in the branch.")).toBe(true);
  });

  it("memories from one plot never reach another plot's prompts", async () => {
    const s1 = createSession(plot.id);
    db.insertMemory({ session_id: s1.id, kind: "event", content: "Kenji swore an oath of vengeance.", importance: 5, known_by: [kenji.id], turn_id: null });
    const plot2 = db.savePlot({ title: "University", characters: [{ character_id: kenji.id, role_note: "", starts_present: true, sort: 0 }] });
    const s2 = createSession(plot2.id);
    ai.director = () => ({ segments: [], perceived: '"Hey."', private_note: "", addressed: [], beats: [{ speaker: kenji.id, direction: "", enters: false, complex: false }] });
    await turn(s2.id, "send", "Hey.");
    const beat = ai.calls.find((c) => c.kind === "beat:Kenji")!;
    expect(beat.full).not.toContain("vengeance");
    expect(beat.full).toContain("University");
    expect(beat.full).not.toContain("Shogun Palace");
  });
});

describe("chronicler rules", () => {
  it("trust changes gradually", () => {
    const prev = { scene: { location: "", time: "", description: "", present: [] }, characters: { k: emptyCharacterState() }, threads: [] };
    const next = applyChronicle(prev, {
      scene: { location: "", time: "", description: "", present: ["k", "unknown"] },
      characters: [{ id: "k", mood: "adoring", goals: [], plans: [], intentions: "", beliefs: [], trust_user: 10, affection_user: -10, user_view: "", relationships: [] }],
      memories: [], threads: [],
    }, new Set(["k"]));
    expect(next.characters.k.trust_user).toBe(3);
    expect(next.characters.k.affection_user).toBe(-3);
    expect(next.scene.present).toEqual(["k"]);
  });
});
