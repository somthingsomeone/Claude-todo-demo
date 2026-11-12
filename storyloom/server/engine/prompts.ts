// All prompt text lives here. Characters are each played by a separate AI call that only
// receives what that character could know — that is the main defence against "mind reading".
import type { CharacterRow, PersonaRow, PlotRow } from "../db.ts";
import type { Beat, CharacterState, SessionState } from "./types.ts";

export type ResponseLength = "short" | "medium" | "long";

const LENGTH_GUIDE: Record<ResponseLength, string> = {
  short: "Keep each turn brief: usually one to three short paragraphs, often less. A single line or gesture is fine when that is what the moment calls for.",
  medium: "Keep each turn reasonably concise: usually two to four short paragraphs. A single line is fine when that is what the moment calls for.",
  long: "You may write fuller turns (up to five or six paragraphs) when the moment is rich, but never pad.",
};

export function field(label: string, value: string | undefined | null): string {
  const v = (value ?? "").trim();
  return v ? `${label}: ${v}\n` : "";
}

export function personaName(p: PersonaRow | undefined): string {
  return p?.name?.trim() || "the traveler";
}

/** Everything about a character, for the character's own actor (includes secrets). */
export function fullCharacterSheet(c: CharacterRow): string {
  return [
    `Name: ${c.name}`,
    field("In short", c.tagline),
    field("Appearance", c.appearance),
    field("Personality", c.personality),
    field("Intelligence and abilities", c.intelligence),
    field("Background and history", c.background),
    field("Speaking style", c.speaking_style),
    field("Emotional tendencies", c.emotional_tendencies),
    field("Motivations and ambitions", c.motivations),
    field("Values and boundaries", c.values_boundaries),
    field("Fears and vulnerabilities", c.fears),
    field("Relationships with others", c.relationships),
    field("Relationship with the user's character", c.relationship_to_user),
    field("Secrets and private objectives (known only to this character)", c.secrets),
    field("Extra instructions from the author", c.instructions),
    c.example_dialogue.trim() ? `Example dialogue (style reference only, not events that happened):\n${c.example_dialogue.trim()}\n` : "",
  ].join("").trim();
}

/** What anyone could see of another character: name and appearance only. */
export function publicCharacterSheet(c: CharacterRow): string {
  return `${c.name}${c.tagline ? ` — ${c.tagline}` : ""}${c.appearance ? `. Looks: ${c.appearance}` : ""}`;
}

export function publicPersonaSheet(p: PersonaRow | undefined): string {
  if (!p) return "The user's character (no description given).";
  return [`Name: ${p.name}`, field("Appearance", p.appearance), field("Role in the story", p.role)].join("\n").replace(/\n+/g, "\n").trim();
}

export function worldBlock(plot: PlotRow): string {
  return [
    `STORY: ${plot.title}`,
    field("Premise", plot.description),
    field("Setting", plot.setting),
    plot.lore.trim() ? `World and lore:\n${plot.lore.trim()}\n` : "",
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function stateBlock(name: string, st: CharacterState | undefined, cast: Map<string, CharacterRow>, userName: string): string {
  if (!st) return `${name}'s current inner state: not yet established — infer it from the character sheet.`;
  const rel = Object.entries(st.relationships ?? {})
    .filter(([id]) => cast.has(id))
    .map(([id, note]) => `- ${cast.get(id)!.name}: ${note}`)
    .join("\n");
  return [
    `${name}'s CURRENT INNER STATE (private — only ${name} knows this):`,
    field("Mood", st.mood),
    st.goals?.length ? `Current goals: ${st.goals.join("; ")}\n` : "",
    st.plans?.length ? `Plans already in motion: ${st.plans.join("; ")}\n` : "",
    field("Private intentions right now", st.intentions),
    st.beliefs?.length ? `Things ${name} knows, believes or suspects:\n${st.beliefs.map((b) => `- ${b}`).join("\n")}\n` : "",
    `Feelings toward ${userName}: trust ${st.trust_user}/10, affection ${st.affection_user}/10 (scale -10..10). ${st.user_view ?? ""}\n`,
    rel ? `How ${name} currently sees the others:\n${rel}\n` : "",
    st.perspective_summary ? `Earlier events as ${name} remembers them:\n${st.perspective_summary}\n` : "",
  ].join("").trim();
}

// ---------------------------------------------------------------------------
// Character actor
// ---------------------------------------------------------------------------

export const CHARACTER_RULES = `You are one actor in a private, collaborative piece of interactive fiction for an adult reader. Several AI actors share the scene; each plays exactly one character and sees only what that character could know. The reader plays their own character (called "the user's character" below) and is the only one who writes that character's words, actions and thoughts.

How to play your character well:

Be a person, not an assistant. Your character has their own goals, judgement, pride, fears and limits. They are not here to please the user's character. They may agree, refuse, bargain, deflect, lie, stay silent, change the subject, walk away, or help — whatever this specific person would actually do given what they want and what they know. Warmth, hostility, trust and attraction must be earned by events in the story, not granted by default, and should shift gradually. Do not flatter the user's character, defer to them, or fall for them unless the story has genuinely built toward it. Do not be artificially hostile either.

Knowledge boundaries — this is essential. Your character knows only: their own sheet and memories, what they have personally seen and heard in the transcript you are given, and what they can reasonably infer. The transcript has already been filtered to what your character witnessed. The user's character's private thoughts and hidden intentions are never shown to you, and you must never act as if your character can read minds. A perceptive character may notice a forced smile, a contradiction, a tremor in the voice, and draw conclusions — that is inference from observable evidence, and it can be wrong. Never reference events your character did not witness or learn about.

Intelligence is shown through decisions, not adjectives. Before acting, privately consider: what does my character want right now, and what do they want long-term? What do they actually know, and what are they unsure of? What is the other person likely trying to do? What are the risks, and what are the likely consequences of each option? What are the contradictions or tells in what they just saw and heard? Then choose the action that this character — with their intelligence, temperament and information — would choose. A brilliant or strategic character anticipates, probes, sets conditions, protects leverage, notices inconsistencies, and does not fall for obvious tricks or hand over advantages for free. They can still err, but only in ways consistent with their limited information and personality. Never announce how clever your character is; let it show.

Manipulative or secretive characters are subtle. They keep a convincing public face, reveal little, use selective truths, build trust deliberately, deflect accusations calmly, and adapt when challenged. They do not monologue their plans, drop obvious hints, or confess just because they are accused. They may still have real feelings and attachments.

Keep your character consistent with their sheet and their history in this story. Growth is allowed only when events have earned it.

Format of your reply:
- Write only your character's next turn, in the present tense. Put physical actions, expressions and brief visible description inside *single asterisks*, written in third person (e.g. *She sets the cup down without looking up.*). Write spoken words as plain text outside the asterisks, without quotation marks.
- Never write the user's character's dialogue, actions, thoughts or feelings, and never decide how they react. Stop at a point where the user's character can respond.
- Never write other characters' dialogue; they have their own actors. You may react to them and address them.
- Never reveal your character's private reasoning, plans or secrets as narration. If they have an inner reaction, show at most what is visible.
- No meta commentary, no headings, no name prefix, no notes to the reader.
- If, on reflection, your character would neither speak nor do anything noticeable at this moment, reply with exactly: [silent]`;

export interface CharacterPromptInput {
  plot: PlotRow;
  character: CharacterRow;
  persona: PersonaRow | undefined;
  others: CharacterRow[]; // other cast members this character might meet
  state: SessionState;
  cast: Map<string, CharacterRow>;
  memories: string[];
  transcript: string;
  beat: Beat;
  length: ResponseLength;
  advanced: boolean;
}

export function characterPrompt(i: CharacterPromptInput): { stable: string; volatile: string; user: string } {
  const userName = personaName(i.persona);
  const c = i.character;
  const stable = [
    CHARACTER_RULES,
    "",
    worldBlock(i.plot),
    "",
    `YOU PLAY: ${c.name}`,
    fullCharacterSheet(c),
    "",
    `THE USER'S CHARACTER (what ${c.name} can see or already knows from the relationship described above):`,
    publicPersonaSheet(i.persona),
    "",
    i.others.length ? `OTHER PEOPLE IN THIS STORY (outward appearance only; ${c.name}'s own opinion of them is in the sheet above and in the inner state):\n${i.others.map((o) => `- ${publicCharacterSheet(o)}`).join("\n")}` : "",
  ].join("\n");

  const present = i.state.scene.present.filter((id) => id !== c.id).map((id) => i.cast.get(id)?.name).filter(Boolean);
  const volatile = [
    `CURRENT SCENE: ${i.state.scene.location || "unspecified"}${i.state.scene.time ? ` — ${i.state.scene.time}` : ""}`,
    i.state.scene.description ? `Scene: ${i.state.scene.description}` : "",
    `Present with ${c.name}: ${[userName, ...present].join(", ")}.`,
    "",
    stateBlock(c.name, i.state.characters[c.id], i.cast, userName),
    "",
    i.memories.length ? `IMPORTANT THINGS ${c.name.toUpperCase()} REMEMBERS FROM THIS STORY:\n${i.memories.map((m) => `- ${m}`).join("\n")}` : "",
    "",
    LENGTH_GUIDE[i.length],
    i.advanced ? `This is a demanding moment. Think it through carefully from ${c.name}'s perspective before writing: their goals, what they know and suspect, the other people's likely intentions, and the consequences of each option.` : "",
  ].join("\n").replace(/\n{3,}/g, "\n\n");

  const user = [
    `TRANSCRIPT — everything ${c.name} has witnessed recently, oldest first. Lines starting with "${userName}:" show only what ${userName} visibly did and audibly said.`,
    "",
    i.transcript || "(The scene is just beginning.)",
    "",
    i.beat.direction ? `Scene note from the director (a nudge, not an order — your character decides): ${i.beat.direction}` : "",
    `Write ${c.name}'s next turn now.`,
  ].join("\n");
  return { stable, volatile, user };
}

// ---------------------------------------------------------------------------
// Narrator
// ---------------------------------------------------------------------------

export const NARRATOR_RULES = `You are the narrator of a private, collaborative piece of interactive fiction for an adult reader. Characters are voiced by separate actors; the reader controls their own character.

Your job is to describe the world: surroundings, atmosphere, the passage of time, arrivals and departures, and the realistic physical consequences of what people do. The world does not bend to the user's character's wishes: actions can fail or succeed depending on plausibility, skill and circumstance, and you describe the outcome fairly — neither punishing nor rewarding the user unduly.

Rules:
- Never write dialogue for any character, and never write the user's character's words, thoughts, feelings or decisions.
- Never reveal characters' secrets, private plans or inner thoughts. Describe only what could be observed.
- Do not introduce major new plot events, characters or twists unless the director note asks for them; then do it plausibly.
- Write in present tense, third person, plain prose without asterisks. Usually one or two short paragraphs. No headings or meta commentary.
- If nothing needs narrating, reply with exactly: [silent]`;

export function narratorPrompt(i: { plot: PlotRow; persona: PersonaRow | undefined; state: SessionState; cast: Map<string, CharacterRow>; transcript: string; beat: Beat; summary: string }): { stable: string; volatile: string; user: string } {
  const userName = personaName(i.persona);
  const castList = [...i.cast.values()].map((c) => `- ${publicCharacterSheet(c)}`).join("\n");
  const stable = [NARRATOR_RULES, "", worldBlock(i.plot), "", `The user's character: ${publicPersonaSheet(i.persona)}`, "", `Cast (outward descriptions):\n${castList}`].join("\n");
  const present = i.state.scene.present.map((id) => i.cast.get(id)?.name).filter(Boolean);
  const volatile = [
    `CURRENT SCENE: ${i.state.scene.location || "unspecified"}${i.state.scene.time ? ` — ${i.state.scene.time}` : ""}`,
    i.state.scene.description ? `Scene: ${i.state.scene.description}` : "",
    `Present: ${[userName, ...present].join(", ")}.`,
    i.summary ? `\nStory so far (outline):\n${i.summary}` : "",
  ].join("\n");
  const user = [
    `RECENT TRANSCRIPT (lines for ${userName} show only what was visible and audible):`,
    "",
    i.transcript || "(The scene is just beginning.)",
    "",
    i.beat.direction ? `Director note: ${i.beat.direction}` : "",
    "Write the narration now.",
  ].join("\n");
  return { stable, volatile, user };
}

// ---------------------------------------------------------------------------
// Director: interprets the user's message and decides who acts
// ---------------------------------------------------------------------------

export const DIRECTOR_RULES = `You are the director of a private, collaborative interactive fiction. You never write story text yourself. You do two jobs.

JOB 1 — Interpret the user's latest message (skip if there is none).
The user writes in roleplay format: text inside *asterisks* is roleplay content (physical actions, observations, private thoughts, decisions, feelings, narration); text outside asterisks is what the user's character says aloud. Classify every piece by meaning, using context — not every starred sentence is an action:
- action: a physical, visible action (opening a door, smiling, walking in, glancing at someone).
- observation: the user's character noticing something. Observable only insofar as others could see them look.
- thought / decision / feeling: inner life — opinions, wondering, judging, secret decisions, hidden emotions. NOT observable by anyone.
- narration: description of the world itself.
- speech: words spoken aloud. Observable by those within earshot.
Split a mixed sentence when needed ("I smile politely, although I secretly hate him" → visible smile + private hatred).
Then write "perceived": a faithful third-person rendering of ONLY what others present could see and hear — visible actions in *asterisks* (third person, using the character's name) and spoken words verbatim (in quotes, @-marks removed). Never leak private content into it, not even as hints like "with obvious contempt" when the contempt was only thought. Visible expressions the user explicitly wrote (a frown, a forced smile) stay. "private_note" collects the private content.
"addressed": ids of characters the user speaks to or targets (including @mentions).

JOB 2 — Decide what happens next, as a list of beats in order.
Each beat is one turn by one present character, or by the narrator. Consider who is physically present, who could hear, who is addressed, each character's personality, goals, relationships, emotional state, and whether speaking or staying silent makes more sense for them. Rules:
- Not everyone responds. Silence is often the most natural choice. Do not add beats just to fill space or to give everyone a turn.
- No fixed order. Characters may react to each other, interrupt, disagree, or ignore one another; the same character may act twice if the exchange truly calls for it.
- A character who is not present cannot act unless they plausibly arrive now (set enters=true and give the reason in the direction).
- Use a narrator beat only when the world itself needs describing (consequences of a physical action, scene transitions, arrivals, time passing). Dialogue often suffices.
- Typically 1–3 beats; at most 5.
- "direction" is a short private nudge to the actor about why they act now (e.g. "reacts to being interrupted"). Never put the user's private thoughts into a direction, never tell a character something they could not know, and never dictate their decision.
- Set complex=true for beats that need careful strategic or psychological reasoning (deception, negotiation, confrontation, high stakes); false for simple moments.
- If the user wrote "continue" or there is no message, let the scene move forward naturally from the characters' own goals.
- Never schedule anything that writes for the user's character.`;

export function directorPrompt(i: {
  plot: PlotRow; persona: PersonaRow | undefined; state: SessionState; cast: CharacterRow[]; transcript: string; summary: string;
  userText: string | null; heuristicHint: string; manualSpeakers: string[] | null; addressedHint: string[];
}): { stable: string; volatile: string; user: string } {
  const userName = personaName(i.persona);
  const castMap = new Map(i.cast.map((c) => [c.id, c]));
  const castLines = i.cast.map((c) => {
    const st = i.state.characters[c.id];
    const here = i.state.scene.present.includes(c.id) ? "PRESENT" : "absent";
    return `- id=${c.id} | ${c.name} [${here}] | ${c.tagline || c.personality.slice(0, 160)}${st?.mood ? ` | mood: ${st.mood}` : ""}${st?.goals?.length ? ` | goals: ${st.goals.slice(0, 3).join("; ")}` : ""}${st?.intentions ? ` | intends: ${st.intentions}` : ""}`;
  }).join("\n");
  const stable = [DIRECTOR_RULES, "", worldBlock(i.plot), "", `The user's character is ${userName}. ${publicPersonaSheet(i.persona)}`].join("\n");
  const volatile = [
    `CURRENT SCENE: ${i.state.scene.location || "unspecified"}${i.state.scene.time ? ` — ${i.state.scene.time}` : ""}. ${i.state.scene.description}`,
    `CAST:\n${castLines}`,
    i.state.threads.length ? `Open story threads: ${i.state.threads.join("; ")}` : "",
    i.summary ? `Story so far (outline):\n${i.summary}` : "",
  ].join("\n\n");
  const user = [
    `RECENT TRANSCRIPT (past user lines show only what was perceivable):`,
    i.transcript || "(nothing yet)",
    "",
    i.userText !== null
      ? `USER'S NEW MESSAGE (raw, may contain private thoughts):\n<<<\n${i.userText}\n>>>\nA rule-based pre-classification, which may be wrong: ${i.heuristicHint}`
      : `No new message from the user: they asked the scene to continue.`,
    i.addressedHint.length ? `@mentioned: ${i.addressedHint.map((id) => `${castMap.get(id)?.name} (${id})`).join(", ")}` : "",
    i.manualSpeakers ? `The user chose who responds this time: ${i.manualSpeakers.map((id) => `${castMap.get(id)?.name} (${id})`).join(", ")}. Produce exactly one beat for each of them, in a natural order.` : "",
  ].join("\n");
  return { stable, volatile, user };
}

export function directorSchema(speakerIds: string[]): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["segments", "perceived", "private_note", "addressed", "beats"],
    properties: {
      segments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "type", "observable"],
          properties: {
            text: { type: "string" },
            type: { type: "string", enum: ["speech", "action", "thought", "decision", "observation", "feeling", "narration"] },
            observable: { type: "boolean" },
          },
        },
      },
      perceived: { type: "string" },
      private_note: { type: "string" },
      addressed: { type: "array", items: { type: "string" } },
      beats: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["speaker", "direction", "enters", "complex"],
          properties: {
            speaker: { type: "string", enum: [...speakerIds, "narrator"] },
            direction: { type: "string" },
            enters: { type: "boolean" },
            complex: { type: "boolean" },
          },
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Chronicler: updates scene, character states and memories after each turn
// ---------------------------------------------------------------------------

export const CHRONICLER_RULES = `You keep the records of a private interactive fiction. After each exchange you update the structured state: the scene, each affected character's inner state, and the important memories. You never write story text.

Principles:
- Record only what actually happened in the transcript. Never invent events, promises or facts.
- Knowledge boundaries: a character learns only what they witnessed (they were present), were told, or could reasonably infer. The user's character's private thoughts are marked PRIVATE: no character learns them. Absent characters learn nothing from the scene.
- Different characters may interpret the same event differently; record beliefs from each character's own perspective ("Akari suspects the newcomer is lying about where they came from").
- Trust and affection change gradually and only for a reason: usually by 0 or ±1, at most ±3 for a dramatic event (a betrayal, saving a life). Keep characters' established personalities; do not soften them without cause.
- Keep goals and plans concrete and current. Remove goals that were achieved or abandoned. Characters do not all need to scheme.
- Memories: add only meaningful, story-relevant events (promises, betrayals, kindness, insults, conflicts, revelations, important conversations, sacrifices, shared experiences, discoveries). Write each as one clear sentence with names. known_by lists the ids of characters who witnessed or learned it. Importance 1 (minor) to 5 (life-changing). Usually 0–3 memories per exchange.
- Scene: update location/time/description if they changed, and the list of present character ids (characters who leave are removed; arrivals added).`;

export function chroniclerPrompt(i: {
  plot: PlotRow; persona: PersonaRow | undefined; state: SessionState; cast: CharacterRow[]; turnTranscript: string; recentMemories: string[];
}): { stable: string; volatile: string; user: string } {
  const userName = personaName(i.persona);
  const castLines = i.cast.map((c) => `- id=${c.id} | ${c.name}: ${c.tagline || c.personality.slice(0, 200)} | motivations: ${c.motivations.slice(0, 200)}${c.secrets ? ` | secrets: ${c.secrets.slice(0, 200)}` : ""}`).join("\n");
  const stable = [CHRONICLER_RULES, "", worldBlock(i.plot), "", `The user's character is ${userName}.`].join("\n");
  const volatile = [
    `CAST:\n${castLines}`,
    `PREVIOUS STATE (JSON):\n${JSON.stringify(i.state)}`,
    i.recentMemories.length ? `Recent memories already recorded (do not duplicate):\n${i.recentMemories.map((m) => `- ${m}`).join("\n")}` : "",
  ].join("\n\n");
  const user = `THE EXCHANGE THAT JUST HAPPENED:\n${i.turnTranscript}\n\nReturn the updated state. In "characters", include only characters whose inner state should change, with their full updated fields.`;
  return { stable, volatile, user };
}

export function chroniclerSchema(castIds: string[]): Record<string, unknown> {
  const ids = { type: "array", items: { type: "string", enum: castIds.length ? castIds : ["none"] } };
  return {
    type: "object",
    additionalProperties: false,
    required: ["scene", "characters", "memories", "threads"],
    properties: {
      scene: {
        type: "object",
        additionalProperties: false,
        required: ["location", "time", "description", "present"],
        properties: { location: { type: "string" }, time: { type: "string" }, description: { type: "string" }, present: ids },
      },
      characters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "mood", "goals", "plans", "intentions", "beliefs", "trust_user", "affection_user", "user_view", "relationships"],
          properties: {
            id: { type: "string", enum: castIds.length ? castIds : ["none"] },
            mood: { type: "string" },
            goals: { type: "array", items: { type: "string" } },
            plans: { type: "array", items: { type: "string" } },
            intentions: { type: "string" },
            beliefs: { type: "array", items: { type: "string" } },
            trust_user: { type: "integer" },
            affection_user: { type: "integer" },
            user_view: { type: "string" },
            relationships: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "note"],
                properties: { id: { type: "string" }, note: { type: "string" } },
              },
            },
          },
        },
      },
      memories: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["content", "importance", "known_by", "kind"],
          properties: {
            content: { type: "string" },
            importance: { type: "integer" },
            known_by: ids,
            kind: { type: "string", enum: ["event", "promise", "betrayal", "kindness", "insult", "conflict", "revelation", "conversation", "sacrifice", "discovery", "relationship"] },
          },
        },
      },
      threads: { type: "array", items: { type: "string" } },
    },
  };
}

// ---------------------------------------------------------------------------
// Summarizer: rolls old messages into summaries (global + per character)
// ---------------------------------------------------------------------------

export const SUMMARIZER_RULES = `You condense older parts of a private interactive fiction so the story can continue with long-term continuity. Be faithful: include only what happened, with names, decisions, promises, conflicts and changes in relationships. Never invent. Write compactly in past tense.

You write two kinds of summary:
1. "outline": the omniscient story outline (what happened overall), merging the previous outline with the new events. Keep it under ~400 words; compress older material more.
2. "perspectives": for each listed character, what THEY remember — only events they witnessed or learned about, interpreted from their point of view, merged with their previous perspective summary. Under ~200 words each. The user's character's private thoughts are never known to anyone.`;

export function summarizerSchema(castIds: string[]): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["outline", "perspectives"],
    properties: {
      outline: { type: "string" },
      perspectives: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "summary"],
          properties: { id: { type: "string", enum: castIds.length ? castIds : ["none"] }, summary: { type: "string" } },
        },
      },
    },
  };
}
