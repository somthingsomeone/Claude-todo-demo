import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Persona } from "../api";
import { confirmDelete, Field, Icon, ImagePicker, TextArea, TopBar } from "../components";

const EMPTY: Omit<Persona, "id"> = { name: "", avatar: null, appearance: "", background: "", personality: "", role: "", relationships: "", instructions: "" };

export function PersonaEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id || id === "new";
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!isNew) api<Persona[]>("/personas").then((list) => list.find((p) => p.id === id)).then((p) => p && setF({ ...EMPTY, ...p }));
  }, [id, isNew]);
  const set = (k: keyof typeof EMPTY) => (v: string | null) => setF((x) => ({ ...x, [k]: v }));
  async function save() {
    if (!f.name.trim()) return setErr("Give your persona a name.");
    await api(isNew ? "/personas" : `/personas/${id}`, { method: isNew ? "POST" : "PUT", body: f });
    nav(-1);
  }
  return (
    <>
      <TopBar title={isNew ? "New Persona" : f.name} onBack={() => nav(-1)} right={!isNew && (
        <button className="icon-btn" onClick={async () => {
          if (!confirmDelete(f.name)) return;
          await api(`/personas/${id}`, { method: "DELETE" });
          nav("/personas");
        }}>{Icon.trash}</button>
      )} />
      <div className="page narrow">
        <div className="form">
          <Field label="Image"><ImagePicker value={f.avatar} onChange={set("avatar")} shape="round" maxSize={768} /></Field>
          <Field label="Name"><input className="input" value={f.name} onChange={(e) => set("name")(e.target.value)} /></Field>
          <Field label="Appearance" hint="Characters can see this."><TextArea value={f.appearance} onChange={set("appearance")} /></Field>
          <Field label="Role in the story" hint="Characters can see this (e.g. 'a foreign envoy newly arrived at court')."><TextArea value={f.role} onChange={set("role")} /></Field>
          <Field label="Background" hint="Private to you. Characters only learn it if you reveal it in the story."><TextArea value={f.background} onChange={set("background")} /></Field>
          <Field label="Personality" hint="For your own reference. The AI never plays your persona."><TextArea value={f.personality} onChange={set("personality")} /></Field>
          <Field label="Relationships" hint="Private notes. What characters know about you is set on each character (“Relationship with your character”)."><TextArea value={f.relationships} onChange={set("relationships")} /></Field>
          <Field label="Additional notes"><TextArea value={f.instructions} onChange={set("instructions")} /></Field>
        </div>
        {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        <div className="sticky-actions">
          <button className="btn ghost" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn primary" onClick={save}>Save persona</button>
        </div>
      </div>
    </>
  );
}
