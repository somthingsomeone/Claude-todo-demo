import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Character, type Persona, type Plot, type PlotCharacter } from "../api";
import { Avatar, Field, ImagePicker, TextArea, TopBar } from "../components";

type Form = Pick<Plot, "title" | "cover" | "description" | "setting" | "lore" | "scenario" | "start_location" | "persona_id"> & { characters: PlotCharacter[] };
const EMPTY: Form = { title: "", cover: null, description: "", setting: "", lore: "", scenario: "", start_location: "", persona_id: null, characters: [] };

export function PlotEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id;
  const [f, setF] = useState<Form>(EMPTY);
  const [chars, setChars] = useState<Character[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Character[]>("/characters").then(setChars);
    api<Persona[]>("/personas").then(setPersonas);
    if (!isNew) api<Plot & { characters: PlotCharacter[] }>(`/plots/${id}`).then((p) => setF({ ...EMPTY, ...p }));
  }, [id, isNew]);

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const inPlot = (cid: string) => f.characters.find((c) => c.character_id === cid);
  function toggle(cid: string) {
    setF((x) => ({
      ...x,
      characters: inPlot(cid) ? x.characters.filter((c) => c.character_id !== cid) : [...x.characters, { character_id: cid, role_note: "", starts_present: true, sort: x.characters.length }],
    }));
  }
  function setPresent(cid: string, v: boolean) {
    setF((x) => ({ ...x, characters: x.characters.map((c) => (c.character_id === cid ? { ...c, starts_present: v } : c)) }));
  }

  async function save() {
    if (!f.title.trim()) return setErr("Give the plot a title.");
    setSaving(true);
    try {
      const p = await api<Plot>(isNew ? "/plots" : `/plots/${id}`, { method: isNew ? "POST" : "PUT", body: f });
      nav(`/plots/${p.id}`, { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title={isNew ? "New Plot" : `Edit ${f.title}`} onBack={() => nav(-1)} />
      <div className="page narrow">
        <div className="form">
          <Field label="Cover image"><ImagePicker value={f.cover} onChange={set("cover")} shape="wide" label="Upload cover" maxSize={1600} /></Field>
          <Field label="Title"><input className="input" value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="The Shogun's Palace" /></Field>
          <Field label="Description" hint="A short pitch shown on the card."><TextArea rows={2} value={f.description} onChange={set("description")} /></Field>
          <Field label="Setting" hint="Where and when."><TextArea rows={2} value={f.setting} onChange={set("setting")} placeholder="Edo Castle, Japan, 1603. Winter. Political tension after the war." /></Field>
          <Field label="World-building and lore" hint="Rules of the world, factions, customs, history. Everyone in the story knows this.">
            <TextArea rows={6} value={f.lore} onChange={set("lore")} />
          </Field>
          <Field label="Starting scenario" hint="Opens every new save as narration. Write it as the scene's first moment.">
            <TextArea rows={5} value={f.scenario} onChange={set("scenario")} placeholder="Snow falls on the inner courtyard as you are led into the audience hall…" />
          </Field>
          <Field label="Starting location"><input className="input" value={f.start_location} onChange={(e) => set("start_location")(e.target.value)} placeholder="Audience hall, Edo Castle" /></Field>

          <Field label="Your persona in this plot">
            <select className="input" value={f.persona_id ?? ""} onChange={(e) => set("persona_id")(e.target.value || null)}>
              <option value="">— none —</option>
              {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Characters" hint="Tap to add or remove. 'Present at start' means they are in the opening scene; others can arrive later.">
            {chars.length === 0 && <div className="empty">No characters yet — create some in the Characters tab first.</div>}
            <div className="cast-pick">
              {chars.map((c) => {
                const pc = inPlot(c.id);
                return (
                  <div key={c.id} className={`cast-row ${pc ? "on" : ""}`}>
                    <Avatar src={c.avatar} name={c.name} size={40} />
                    <div className="grow" onClick={() => toggle(c.id)} style={{ cursor: "pointer" }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="small-text muted">{c.tagline}</div>
                    </div>
                    {pc && (
                      <label className="toggle"><input type="checkbox" checked={pc.starts_present} onChange={(e) => setPresent(c.id, e.target.checked)} />Present at start</label>
                    )}
                    <button className={`btn small ${pc ? "" : "primary"}`} onClick={() => toggle(c.id)}>{pc ? "Remove" : "Add"}</button>
                  </div>
                );
              })}
            </div>
          </Field>
        </div>
        {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        <div className="sticky-actions">
          <button className="btn ghost" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save plot"}</button>
        </div>
      </div>
    </>
  );
}
