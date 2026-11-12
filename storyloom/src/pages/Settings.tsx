import { useEffect, useRef, useState } from "react";
import { api, type Settings } from "../api";
import { exportAll, importAll } from "../local/api";
import { useCap } from "../local/storage";
import { askConfirm } from "../dialog";
import { Field } from "../components";

export function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const load = () => api<Settings>("/settings").then(setS);
  useEffect(() => {
    load();
  }, []);
  if (!s) return null;

  async function save(patch: Partial<Settings>) {
    await api("/settings", { method: "PUT", body: patch });
    setMsg("Saved");
    setTimeout(() => setMsg(""), 1500);
    load();
  }

  async function doExport() {
    const data = await exportAll();
    const name = `storyloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const downloads = await useCap<{ save(o: { filename: string; data: string }): Promise<void> }>("downloads");
    try {
      if (downloads) await downloads.save({ filename: name, data });
      else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
        a.download = name;
        a.click();
      }
      setMsg("Backup ready");
    } catch {
      setMsg("Backup was not saved.");
    }
  }
  async function doImport(f: File | undefined) {
    if (!f) return;
    if (!(await askConfirm("Restore this backup? Items with the same id will be replaced by the backup's version."))) return;
    try {
      const n = await importAll(await f.text());
      setMsg(`Restored ${n} items`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="page narrow">
      <h1 className="hero-title">Settings</h1>
      <p className="lead">{msg || "Changes save immediately."}</p>

      <h3 className="section-title">AI</h3>
      <div className="card small-text" style={{ lineHeight: 1.6 }}>
        {s.ai ? (
          <p style={{ margin: 0 }}>✅ Connected to <b>your Claude account</b>. No API key and no extra bill — it uses your normal Claude plan (and its usage limits). The first time a story runs, Claude asks you to <b>Allow</b>.</p>
        ) : (
          <p style={{ margin: 0 }} className="banner">Claude isn't reachable here. Open Storyloom as an Artifact inside claude.ai or the Claude app.</p>
        )}
      </div>

      <div className="form" style={{ marginTop: 16 }}>
        <Field label="Storyteller quality" hint="“Most capable” makes every character reply use Claude's strongest model. Smarter, but slower and uses more of your plan's limit.">
          <div className="seg">
            <button className={s.storyQuality === "default" ? "on" : ""} onClick={() => save({ storyQuality: "default" })}>Balanced</button>
            <button className={s.storyQuality === "complex" ? "on" : ""} onClick={() => save({ storyQuality: "complex" })}>Most capable</button>
          </div>
        </Field>
        <Field label="Response length">
          <div className="seg">
            {(["short", "medium", "long"] as const).map((v) => (
              <button key={v} className={s.responseLength === v ? "on" : ""} onClick={() => save({ responseLength: v })}>{v[0].toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
        </Field>
      </div>

      <h3 className="section-title">Normal vs Advanced (per story, brain chip in the chat)</h3>
      <div className="card small-text" style={{ lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}><b>Normal</b>: one quick “director” step (who reacts, and what others can see of your *actions*), one step per character who answers, and one memory step. Replies usually start within seconds.</p>
        <p><b>Advanced</b>: same steps, but tense moments (deception, negotiation, confrontation) go to Claude's strongest model with deep thinking. Simple moments stay light. Expect 20–60 seconds before a hard reply, and more of your usage limit.</p>
        <p style={{ marginBottom: 0 }} className="muted">Neither mode guarantees perfect intelligence; Advanced makes strategic and psychological consistency noticeably more likely.</p>
      </div>

      <h3 className="section-title">Your data</h3>
      <div className="card small-text" style={{ lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>{s.storage === "claude" ? "Saved inside this Artifact, in your private space. Only you can read it." : "Preview mode: saved in this browser only."}</p>
        <div className="row">
          <button className="btn small" onClick={doExport}>Download backup</button>
          <button className="btn small ghost" onClick={() => fileRef.current?.click()}>Restore backup…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
      </div>
    </div>
  );
}
