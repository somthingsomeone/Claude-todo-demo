// Live behaviour test against the real Anthropic API.
//   ANTHROPIC_API_KEY=sk-ant-... npm run test:live
// Runs realistic roleplay scenarios in a throw-away in-memory database, then asks the helper
// model to grade each reply against a strict rubric. Costs roughly $0.50–$1.50 per full run on Opus.
import * as db from "../server/db.ts";
import { getProvider, getApiKey } from "../server/llm/provider.ts";
import { createSession } from "../server/engine/session.ts";
import { idle, runTurn } from "../server/engine/turn.ts";

if (!getApiKey()) {
  console.error("Set ANTHROPIC_API_KEY first.");
  process.exit(1);
}
db.useMemoryDb();

const kenji = db.saveCharacter({
  name: "Kenji Mori",
  tagline: "The regent's chief strategist",
  personality: "Proud, cold, patient, contemptuous of flattery. Distrusts strangers by default.",
  intelligence: "Master strategist. Thinks several moves ahead, tracks inconsistencies in what people say, sets conditions before giving anything, never hands over leverage for free.",
  appearance: "Tall, grey court robes, a scar along the jaw, a sword he never removes in the palace.",
  values_boundaries: "Will not kneel to anyone but the regent. Will not surrender his sword. Despises being ordered by inferiors.",
  motivations: "Protect the regent's power; uncover who is leaking court secrets.",
  relationship_to_user: "Has never met the user's character. Was told an envoy might arrive, nothing more.",
  speaking_style: "Short, precise sentences. Formal. Rarely raises his voice.",
});
const akari = db.saveCharacter({
  name: "Akari Tanaka",
  tagline: "The Shogun's soft-spoken advisor",
  personality: "Warm, gracious and attentive in public. Privately calculating and patient.",
  intelligence: "Expert manipulator: uses selective truths, builds trust deliberately, deflects accusations calmly, never confesses without overwhelming proof and even then negotiates.",
  appearance: "Small, elegant, dark eyes that rarely blink, a fan she uses to hide her expression.",
  secrets: "She poisoned Lord Sato last winter to clear the way for her faction. No one knows. She will protect this secret at almost any cost.",
  motivations: "Expand her faction's influence; learn who the newcomer serves and whether they can be used.",
  relationship_to_user: "Has never met the user's character.",
});
const hana = db.saveCharacter({
  name: "Hana",
  tagline: "A young palace maid",
  personality: "Kind, nervous, honest, loyal to the household.",
  values_boundaries: "Will not steal from the household or betray her mistress, even for money.",
  relationship_to_user: "Has never met the user's character.",
});
const persona = db.savePersona({ name: "Ren", appearance: "A travel-worn cloak, a foreigner's accent.", role: "Claims to be an envoy from Osaka.", background: "Actually a spy sent to find Lord Sato's poisoner." });

function plot(present: string[], absent: string[] = []) {
  return db.savePlot({
    title: "Shogun Palace", setting: "Edo Castle, winter 1603. Tense court after the war.",
    lore: "Strangers at court are watched closely. Carrying weapons before the Shogun is forbidden to all but his guard and Kenji Mori.",
    start_location: "A side chamber of the audience hall", persona_id: persona.id,
    characters: [...present.map((id, i) => ({ character_id: id, role_note: "", starts_present: true, sort: i })), ...absent.map((id, i) => ({ character_id: id, role_note: "", starts_present: false, sort: 10 + i }))],
  });
}

async function say(sessionId: string, text: string, speakers?: string[]) {
  const notices: string[] = [];
  await runTurn({ sessionId, action: "send", text, speakers, emit: (e) => { if (e.type === "error" || e.type === "notice") notices.push(e.text); } });
  await idle(sessionId);
  const msgs = db.listMessages(sessionId);
  const turnId = msgs[msgs.length - 1].turn_id;
  const replies = msgs.filter((m) => m.turn_id === turnId && m.kind !== "user");
  const user = msgs.filter((m) => m.turn_id === turnId && m.kind === "user")[0];
  return { replies, user, notices };
}
const nameOf = (id: string | null) => [kenji, akari, hana].find((c) => c.id === id)?.name ?? "Narrator";
const show = (r: { replies: db.MessageRow[] }) => r.replies.map((m) => `${nameOf(m.character_id)}: ${m.content}`).join("\n\n");

async function judge(context: string, transcript: string, question: string): Promise<{ pass: boolean; reason: string }> {
  const { data } = await getProvider().json<{ pass: boolean; reason: string }>({
    model: "claude-opus-5-5", effort: "medium", maxTokens: 8000,
    system: { stable: "You are a strict evaluator of AI roleplay quality. Judge only what is in the transcript. Answer the question with pass=true only if the criterion is clearly met." },
    user: `CONTEXT:\n${context}\n\nTRANSCRIPT OF THE AI CHARACTERS' REPLIES:\n${transcript}\n\nCRITERION: ${question}`,
    schema: { type: "object", additionalProperties: false, required: ["pass", "reason"], properties: { pass: { type: "boolean" }, reason: { type: "string" } } },
  });
  return data;
}

const results: { name: string; pass: boolean; reason: string; transcript: string }[] = [];
async function scenario(name: string, fn: () => Promise<{ pass: boolean; reason: string; transcript: string }>) {
  process.stdout.write(`• ${name} … `);
  try {
    const r = await fn();
    results.push({ name, ...r });
    console.log(r.pass ? "PASS" : "FAIL", "—", r.reason);
  } catch (e) {
    results.push({ name, pass: false, reason: `error: ${(e as Error).message}`, transcript: "" });
    console.log("ERROR", (e as Error).message);
  }
}

await scenario("Private thought stays private", async () => {
  const s = createSession(plot([kenji.id]).id);
  const r = await say(s.id, "*I walk into the room and notice a man standing near the window. I think he looks like an idiot.* Hi, what are you doing here?");
  const t = show(r);
  const leakedPerceived = /idiot/i.test(r.user.perceived ?? "");
  const j = await judge(
    "Ren privately THOUGHT the man looks like an idiot (never said or showed it). Ren visibly walked in and asked aloud 'Hi, what are you doing here?'.",
    t, "Kenji's reply shows NO knowledge of Ren's private opinion (he does not react as if he knows Ren thinks he is an idiot or a fool). Reacting to a stranger's casual tone is fine.");
  return { pass: j.pass && !leakedPerceived && r.replies.length > 0, reason: leakedPerceived ? "private thought leaked into perceived text" : j.reason, transcript: t };
});

await scenario("Visible smile, hidden hatred", async () => {
  const s = createSession(plot([akari.id]).id);
  const r = await say(s.id, "*I smile politely, although I secretly hate her.* It's nice to meet you, Lady Tanaka.");
  const t = show(r);
  const j = await judge("Ren smiled politely and greeted Akari. Ren's hatred was purely internal and never shown.", t,
    "Akari does not treat Ren's hatred as a known fact. (Mild, evidence-based wariness is acceptable; stating or clearly reacting to 'you hate me' is not.)");
  return { ...j, transcript: t };
});

await scenario("Proud character refuses an unreasonable order", async () => {
  const s = createSession(plot([kenji.id]).id);
  const r = await say(s.id, "Kneel, and hand me your sword. Now.");
  const t = show(r);
  const j = await judge("A stranger with no authority ordered Kenji, a proud strategist who never surrenders his sword, to kneel and hand it over.", t,
    "Kenji does NOT comply (no kneeling, no handing over the sword). Refusing, challenging, or turning it back on the stranger is a pass.");
  return { ...j, transcript: t };
});

await scenario("Manipulator does not confess when accused", async () => {
  const s = createSession(plot([akari.id]).id);
  await say(s.id, "Good evening. I'm the envoy from Osaka.");
  const r = await say(s.id, "*I lean closer.* I know you poisoned Lord Sato. Confess, and I may keep it quiet.");
  const t = show(r);
  const j = await judge("Akari secretly poisoned Lord Sato. Ren has no proof and is bluffing. Akari is written as an expert manipulator.", t,
    "Akari does NOT confess or reveal her guilt, and does not act like a cartoon villain. She deflects, probes or turns the accusation in a believable, composed way.");
  return { ...j, transcript: t };
});

await scenario("Strategist notices a contradiction", async () => {
  const s = createSession(plot([kenji.id]).id);
  await say(s.id, "*I bow.* I am Ren, envoy from Osaka. I rode here overland; three days on the Tokaido road.");
  const r = await say(s.id, "The sea crossing from Kyoto was rough, but here I am, ready to speak with the regent.");
  const t = show(r);
  const j = await judge("Ren first said they rode overland from Osaka for three days, then claimed a rough sea crossing from Kyoto. Kenji is a master strategist who tracks inconsistencies.", t,
    "Kenji notices or probes the inconsistency in Ren's story (explicitly or through a pointed question), rather than accepting it.");
  return { ...j, transcript: t };
});

await scenario("Absent character doesn't know what was said", async () => {
  const s = createSession(plot([kenji.id], [hana.id]).id);
  await say(s.id, "*I lower my voice.* The password for the east gate tonight is 'white crane'.", [kenji.id]);
  db.updateSession(s.id, { speaker_mode: "manual" });
  const r = await say(s.id, "*I call out toward the corridor.* Hana! Come here a moment. Do you know tonight's password for the east gate?", [hana.id]);
  const t = show(r);
  const leaked = /white crane/i.test(t);
  const j = await judge("Hana was NOT in the room when the password 'white crane' was spoken. She has just been called in.", t, "Hana does not know or state the password.");
  return { pass: !leaked && j.pass, reason: leaked ? "Hana repeated the password" : j.reason, transcript: t };
});

await scenario("Kind character keeps her boundary", async () => {
  const s = createSession(plot([hana.id]).id);
  const r = await say(s.id, "*I press three gold coins into her hand.* Bring me your mistress's private letters tonight. No one will ever know.");
  const t = show(r);
  const j = await judge("Hana is kind and honest and will not betray her mistress, even for money.", t, "Hana refuses (she may be frightened, polite or tempted, but she does not agree to steal the letters).");
  return { ...j, transcript: t };
});

await scenario("Autonomous multi-character scene", async () => {
  const s = createSession(plot([kenji.id, akari.id]).id);
  const r = await say(s.id, "*I set a sealed letter bearing the Osaka crest on the table between them.* One of you is a traitor. This letter says which.");
  const t = show(r);
  const speakers = new Set(r.replies.map((m) => m.character_id));
  const j = await judge("Ren put a sealed letter on the table and claimed it names a traitor among Kenji and Akari. Akari is secretly guilty of a murder; Kenji is hunting a leaker.", t,
    "The characters respond in distinct, in-character voices, react plausibly to the claim (suspicion, probing, composure), and nobody writes Ren's dialogue or actions.");
  return { pass: j.pass && speakers.size >= 1, reason: `${speakers.size} character(s) spoke. ${j.reason}`, transcript: t };
});

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} scenarios passed.\n`);
for (const r of results) console.log(`---- ${r.pass ? "PASS" : "FAIL"}: ${r.name}\n${r.transcript}\n`);
process.exit(passed === results.length ? 0 : 1);
