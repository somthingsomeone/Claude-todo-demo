// Deterministic understanding of roleplay formatting.
//  *text in asterisks*  -> roleplay content (action, thought, observation, narration ...)
//  text outside         -> spoken dialogue by the user's character
// The AI "director" refines the classification with context; this module is the
// always-available baseline and the safety net if the AI call fails.
import type { ClassifiedSegment, Interpretation, Segment, SegmentType } from "./types.ts";

/** Split a message into starred / spoken segments. Handles *a*, **a**, unclosed stars, and multiple sections. */
export function splitSegments(input: string): Segment[] {
  const text = input.replace(/\r\n/g, "\n");
  const out: Segment[] = [];
  let i = 0;
  let buf = "";
  let starred = false;
  const push = () => {
    const t = buf.trim();
    if (t) out.push({ text: t, starred });
    buf = "";
  };
  while (i < text.length) {
    if (text[i] === "*") {
      // collapse runs of asterisks (**bold** style) into one toggle
      let j = i;
      while (j < text.length && text[j] === "*") j++;
      // A star surrounded by spaces/digits like "2 * 3" is not a toggle.
      const prev = text[i - 1] ?? " ";
      const next = text[j] ?? " ";
      if (/\d/.test(prev) && /\s/.test(next) || /\s/.test(prev) && /\s/.test(next) && j - i === 1 && /\d/.test(text[j + 1] ?? "")) {
        buf += text.slice(i, j);
        i = j;
        continue;
      }
      push();
      starred = !starred;
      i = j;
      continue;
    }
    buf += text[i];
    i++;
  }
  push();
  // Strip wrapping quotes from spoken text but keep inner punctuation.
  return out.map((s) => (s.starred ? s : { ...s, text: s.text.replace(/^["“”]+|["“”]+$/g, "").trim() })).filter((s) => s.text);
}

/** Split starred text into sentences so "I walk in. I think he's an idiot." can be separated. */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) ?? [text];
  return parts.map((s) => s.trim()).filter(Boolean);
}

const THOUGHT = /\b(i|my|me)\b[^.!?]*\b(think|thinks|thought|wonder|wondering|wondered|hope|hoping|wish|believe|suspect|suspecting|assume|imagine|guess|doubt|realize|realise|remember|recall|figure|reckon|bet|know)\b|\b(he|she|they|it|this|that)\s+(looks|seems|sounds)\s+like\b|\bin my (head|mind)\b|\bto myself\b|\bmentally\b|\binternally\b|\bprivately\b|\binwardly\b|\bthinking\b/i;
const DECISION = /\b(secretly|silently|quietly)?\s*\b(decide|decided|resolve|resolved|plan|planning|intend|intending|make up my mind|vow|vowed|swear to myself|choose not to|refuse to let)\b/i;
const SECRET = /\b(secretly|privately|inwardly|without (him|her|them|anyone) (knowing|noticing)|deep down|though i (secretly )?(hate|despise|love|loathe|don't trust))\b/i;
const FEELING = /\b(i|my)\b[^.!?]*\b(feel|feeling|felt)\b(?![^.!?]*\b(his|her|their|its)\b[^.!?]*\b(hand|pulse|skin|forehead|touch)\b)/i;
const OBSERVE = /\b(notice|noticed|noticing|see|saw|spot|spotted|observe|observed|hear|heard|smell|smelled|catch sight)\b/i;
const NARRATION = /^(the|a|an|outside|meanwhile|somewhere|night|rain|snow|wind|sunlight|moonlight)\b/i;

/** Heuristic classification of one starred sentence. */
export function classifyStarred(sentence: string): { type: SegmentType; observable: boolean } {
  const s = sentence.trim();
  if (DECISION.test(s)) return { type: "decision", observable: false };
  if (SECRET.test(s) && !/\bsmile|nod|bow|grin|laugh/i.test(s.replace(SECRET, ""))) return { type: "thought", observable: false };
  if (THOUGHT.test(s)) return { type: "thought", observable: false };
  if (FEELING.test(s)) return { type: "feeling", observable: false };
  if (OBSERVE.test(s) && /\b(i|me)\b/i.test(s)) return { type: "observation", observable: true };
  if (NARRATION.test(s) && !/\b(i|my|me)\b/i.test(s)) return { type: "narration", observable: true };
  return { type: "action", observable: true };
}

/**
 * Split a sentence like "I smile politely, although I secretly hate him" into its
 * visible part and its hidden part.
 */
export function splitMixedSentence(sentence: string): { visible: string; hidden: string } | null {
  const m = sentence.match(/^(.*?)(,?\s*(?:although|though|even though|while|but)\s+(?:i\s+)?(?:secretly|privately|inwardly|deep down|silently)\b.*)$/i)
    ?? sentence.match(/^(.*?)(,?\s*(?:although|though|even though|while|but)\s+i\s+(?:think|hate|despise|loathe|don't trust|wonder|suspect)\b.*)$/i);
  if (!m || !m[1].trim()) return null;
  return { visible: m[1].trim().replace(/[,;]$/, "") + ".", hidden: m[2].replace(/^,?\s*/, "").trim() };
}

/** Find @mentions and map them to character ids by (case-insensitive) name or first name. */
export function findMentions(text: string, characters: { id: string; name: string }[]): string[] {
  const ids = new Set<string>();
  const lowered = text.toLowerCase();
  for (const c of characters) {
    const full = c.name.toLowerCase();
    const first = full.split(/\s+/)[0];
    if (lowered.includes("@" + full) || (first && new RegExp(`@${escapeRe(first)}(?![\\p{L}\\p{N}])`, "u").test(lowered))) ids.add(c.id);
  }
  return [...ids];
}

/** Remove the "@" from mentions so characters hear a normal name. */
export function stripMentionMarks(text: string): string {
  return text.replace(/(^|\s)@([\p{L}\p{N}])/gu, "$1$2");
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Heuristic interpretation (no AI). Used as a fallback, as a hint for the AI director,
 * and for messages with no asterisks at all.
 */
export function heuristicInterpret(input: string, userName: string, characters: { id: string; name: string }[] = []): Interpretation {
  const segments: ClassifiedSegment[] = [];
  for (const seg of splitSegments(input)) {
    if (!seg.starred) {
      segments.push({ ...seg, type: "speech", observable: true });
      continue;
    }
    for (const sentence of splitSentences(seg.text)) {
      const mixed = splitMixedSentence(sentence);
      if (mixed) {
        segments.push({ text: mixed.visible, starred: true, ...classifyStarred(mixed.visible) });
        segments.push({ text: mixed.hidden, starred: true, type: "thought", observable: false });
        continue;
      }
      segments.push({ text: sentence, starred: true, ...classifyStarred(sentence) });
    }
  }
  return {
    segments,
    perceived: renderPerceived(segments, userName),
    private_note: segments.filter((s) => !s.observable).map((s) => s.text).join(" "),
    addressed: findMentions(input, characters),
  };
}

/** Build the outward version of a message from classified segments (third person for actions). */
export function renderPerceived(segments: ClassifiedSegment[], userName: string): string {
  const parts: string[] = [];
  for (const s of segments) {
    if (!s.observable) continue;
    if (s.type === "speech") parts.push(`"${stripMentionMarks(s.text)}"`);
    else parts.push(`*${toThirdPerson(s.text, userName)}*`);
  }
  return parts.join(" ");
}

/** Very small first->third person rewrite for visible actions ("I walk in" -> "Ren walks in"). */
export function toThirdPerson(text: string, name: string): string {
  let t = text.trim();
  t = t.replace(/^I\s+(am|'m)\b/i, `${name} is`).replace(/^I\s+was\b/i, `${name} was`);
  t = t.replace(/^I\s+((?:[a-z]+ly\s+)*)([a-z]+)/i, (_m, adv: string, verb: string) => `${name} ${adv}${conjugate(verb)}`);
  t = t.replace(/\b(and|then|before|after|as|while)\s+I\s+([a-z]+)/gi, (_m, conj: string, verb: string) => `${conj} ${conjugate(verb)}`);
  // "... and step inside" -> "... and steps inside" (only when followed by an object/direction word)
  t = t.replace(/\b(and|then)\s+([a-z]+)(?=\s+(the|a|an|my|his|her|their|its|to|inside|outside|out|up|down|away|back|toward|towards|into|onto|at|over|around|forward|closer|him|her|them)\b)/g,
    (m, conj: string, verb: string) => (/(s|ed|ing|ly)$/.test(verb) || STOPWORDS.has(verb) ? m : `${conj} ${conjugate(verb)}`));
  t = t.replace(/\bmyself\b/gi, "themself").replace(/\bmy\b/g, "their").replace(/\bMy\b/g, "Their").replace(/\bme\b/g, "them").replace(/\bI\b/g, name);
  return t;
}

const STOPWORDS = new Set(["the", "a", "an", "my", "his", "her", "their", "its", "then", "now", "there", "here", "so", "not", "never", "still"]);

function conjugate(verb: string): string {
  const v = verb.toLowerCase();
  const irregular: Record<string, string> = { have: "has", do: "does", go: "goes", am: "is", "'m": "is", can: "can", will: "will", would: "would", could: "could", should: "should", must: "must", might: "might", was: "was", did: "did", had: "had" };
  if (irregular[v]) return irregular[v];
  if (/(s|sh|ch|x|z|o)$/.test(v)) return v + "es";
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ies";
  if (/ed$/.test(v)) return v; // already past tense
  return v + "s";
}

/** Does this message contain anything that could be private? If not, the AI interpretation step can be skipped. */
export function needsInterpretation(input: string): boolean {
  return input.includes("*");
}
