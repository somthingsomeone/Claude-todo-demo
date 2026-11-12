import { useEffect, useState } from "react";
import { api, type Settings } from "../api";
import { Field } from "../components";

export function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState("");
  const load = () => api<Settings>("/settings").then(setS);
  useEffect(() => {
    load();
  }, []);
  if (!s) return null;

  async function save(patch: Partial<Settings> & { apiKey?: string }) {
    await api("/settings", { method: "PUT", body: patch });
    setSaved("Saved");
    setTimeout(() => setSaved(""), 1500);
    load();
  }
  const model = (id: string) => s.models.find((m) => m.id === id);

  return (
    <div className="page narrow">
      <h1 className="hero-title">Settings</h1>
      <p className="lead">{saved || "Changes save immediately."}</p>

      <h3 className="section-title">AI connection</h3>
      <div className="card">
        {s.apiKeyConfigured ? (
          <p style={{ marginTop: 0 }}>✅ Anthropic API key connected <span className="muted">({s.apiKeyHint}, from {s.apiKeySource})</span>.</p>
        ) : (
          <div className="banner" style={{ marginBottom: 12 }}>
            No API key yet. The stories need one to run. Get a key at <b>console.anthropic.com</b> → API Keys → Create key, then paste it below.
          </div>
        )}
        {s.apiKeySource !== "environment" && (
          <div className="row">
            <input className="input" style={{ flex: 1, minWidth: 200 }} type="password" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
            <button className="btn primary" disabled={!key.trim()} onClick={() => { save({ apiKey: key }); setKey(""); }}>Save key</button>
            {s.apiKeyConfigured && <button className="btn ghost danger" onClick={() => save({ apiKey: "" })}>Remove</button>}
          </div>
        )}
        <p className="small-text faint" style={{ marginBottom: 0 }}>The key is stored only on your server and is never sent to the browser.</p>
      </div>

      <h3 className="section-title">Models</h3>
      <div className="form">
        <Field label="Storyteller model (writes every character's turn)" hint={model(s.storyModel)?.note}>
          <select className="input" value={s.storyModel} onChange={(e) => save({ storyModel: e.target.value })}>
            {s.models.map((m) => <option key={m.id} value={m.id}>{m.label} — ${m.input}/${m.output} per M tokens</option>)}
          </select>
        </Field>
        <Field label="Helper model (decides who speaks, reads your *actions*, keeps memories)" hint={model(s.helperModel)?.note}>
          <select className="input" value={s.helperModel} onChange={(e) => save({ helperModel: e.target.value })}>
            {s.models.map((m) => <option key={m.id} value={m.id}>{m.label} — ${m.input}/${m.output} per M tokens</option>)}
          </select>
        </Field>
        <Field label="Response length">
          <div className="seg">
            {(["short", "medium", "long"] as const).map((v) => (
              <button key={v} className={s.responseLength === v ? "on" : ""} onClick={() => save({ responseLength: v })}>{v[0].toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
        </Field>
      </div>

      <h3 className="section-title">Normal vs Advanced intelligence</h3>
      <div className="card small-text" style={{ lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>You switch this per story with the brain button in the chat.</p>
        <p><b>Normal</b> — each of your messages costs one quick “director” call (who reacts, and what others can see of your *actions*), one call per character who responds, and one bookkeeping call for memory. Characters think briefly before answering. Typical cost with Opus 5.5: roughly <b>$0.05–0.15 per message</b>; replies start in a few seconds.</p>
        <p><b>Advanced</b> — the same steps, but the director looks deeper and characters reason much longer whenever the moment is tense (deception, negotiation, confrontation). Simple moments stay light. Expect about <b>2–4× the cost</b> and <b>10–40 seconds</b> before a hard reply starts.</p>
        <p style={{ marginBottom: 0 }} className="muted">Neither mode guarantees perfect intelligence: the AI can still make mistakes. Advanced makes strategic and psychological consistency noticeably more likely. Each story shows its running cost estimate in its menu.</p>
      </div>

      <h3 className="section-title">Account</h3>
      <button className="btn" onClick={async () => { await api("/logout", { body: {} }); location.reload(); }}>Log out</button>
    </div>
  );
}
