import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, uploadImage, type Character } from "../api";
import { confirmDelete, Field, Icon, ImagePicker, TextArea, TopBar } from "../components";

const EMPTY: Omit<Character, "id" | "created_at" | "updated_at"> = {
  name: "", avatar: null, images: [], tagline: "", appearance: "", personality: "", intelligence: "", background: "",
  speaking_style: "", emotional_tendencies: "", motivations: "", values_boundaries: "", fears: "", relationships: "",
  relationship_to_user: "", secrets: "", example_dialogue: "", instructions: "",
};

type Form = typeof EMPTY;

export function CharacterEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const isNew = !id || id === "new";

  useEffect(() => {
    if (!isNew) api<Character>(`/characters/${id}`).then((c) => setF({ ...EMPTY, ...c }));
  }, [id, isNew]);

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!f.name.trim()) return setErr("Give the character a name.");
    setSaving(true);
    try {
      await api(isNew ? "/characters" : `/characters/${id}`, { method: isNew ? "POST" : "PUT", body: f });
      nav(-1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addRefImage(file: File | undefined) {
    if (!file) return;
    const url = await uploadImage(file, 1280);
    setF((x) => ({ ...x, images: [...x.images, url] }));
  }

  return (
    <>
      <TopBar
        title={isNew ? "New Character" : f.name || "Character"}
        onBack={() => nav(-1)}
        right={!isNew && (
          <>
            <button className="icon-btn" title="Duplicate" onClick={async () => {
              const c = await api<Character>(`/characters/${id}/duplicate`, { body: {} });
              nav(`/characters/${c.id}`, { replace: true });
            }}>{Icon.copy}</button>
            <button className="icon-btn" title="Delete" onClick={async () => {
              if (!(await confirmDelete(`${f.name} (removes them from every plot)`))) return;
              await api(`/characters/${id}`, { method: "DELETE" });
              nav("/characters");
            }}>{Icon.trash}</button>
          </>
        )}
      />
      <div className="page narrow">
        <div className="form">
          <Field label="Portrait" hint="Shown beside every message this character writes.">
            <ImagePicker value={f.avatar} onChange={set("avatar")} shape="round" label="Upload portrait" maxSize={768} />
          </Field>
          <Field label="Name"><input className="input" value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="Akari Tanaka" /></Field>
          <Field label="One-line summary"><input className="input" value={f.tagline} onChange={(e) => set("tagline")(e.target.value)} placeholder="The Shogun's soft-spoken spymaster" /></Field>
          <Field label="Personality" hint="Be specific. Traits you write here drive real decisions (a suspicious person will not trust strangers).">
            <TextArea rows={4} value={f.personality} onChange={set("personality")} placeholder="Calm, observant, dryly funny. Trusts no one at first. Proud of her discretion…" />
          </Field>
          <Field label="Appearance"><TextArea value={f.appearance} onChange={set("appearance")} placeholder="Small, sharp dark eyes, ink-stained fingers…" /></Field>
          <Field label="Relationship with your character" hint="What they know about you and how they feel at the start.">
            <TextArea value={f.relationship_to_user} onChange={set("relationship_to_user")} placeholder="Has never met you. Will assume you are a spy until proven otherwise." />
          </Field>

          <details className="adv">
            <summary>Mind, history and motives</summary>
            <div className="form">
              <Field label="Intelligence and abilities" hint="e.g. 'Master strategist: plans three moves ahead, spots contradictions, never reveals her hand.'">
                <TextArea value={f.intelligence} onChange={set("intelligence")} />
              </Field>
              <Field label="Background and history"><TextArea rows={4} value={f.background} onChange={set("background")} /></Field>
              <Field label="Motivations and ambitions"><TextArea value={f.motivations} onChange={set("motivations")} /></Field>
              <Field label="Values and boundaries" hint="Things they will not do, or will only do for a strong reason."><TextArea value={f.values_boundaries} onChange={set("values_boundaries")} /></Field>
              <Field label="Fears and vulnerabilities"><TextArea value={f.fears} onChange={set("fears")} /></Field>
              <Field label="Emotional tendencies"><TextArea value={f.emotional_tendencies} onChange={set("emotional_tendencies")} /></Field>
            </div>
          </details>

          <details className="adv">
            <summary>Voice, relationships and secrets</summary>
            <div className="form">
              <Field label="Speaking style"><TextArea value={f.speaking_style} onChange={set("speaking_style")} placeholder="Short sentences. Formal court speech. Never raises her voice." /></Field>
              <Field label="Relationships with other characters" hint="Use their names, e.g. 'Kenji: old rival, respects but distrusts him.'"><TextArea value={f.relationships} onChange={set("relationships")} /></Field>
              <Field label="Secrets and private objectives" hint="Only this character's own actor ever sees this. Others must discover it in the story.">
                <TextArea value={f.secrets} onChange={set("secrets")} />
              </Field>
              <Field label="Example dialogue" hint="A few lines in their voice. Used for style only."><TextArea rows={4} value={f.example_dialogue} onChange={set("example_dialogue")} /></Field>
              <Field label="Custom behaviour instructions"><TextArea value={f.instructions} onChange={set("instructions")} placeholder="Never uses modern slang. Becomes colder when lied to." /></Field>
            </div>
          </details>

          <Field label="Reference images" hint="Extra pictures for your own reference (outfits, mood).">
            <div className="thumbs">
              {f.images.map((src) => (
                <div className="thumb" key={src}>
                  <img src={src} alt="" />
                  <button type="button" onClick={() => setF((x) => ({ ...x, images: x.images.filter((i) => i !== src) }))} aria-label="Remove">×</button>
                </div>
              ))}
              <label className="thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)" }}>
                {Icon.plus}
                <input type="file" accept="image/*" hidden onChange={(e) => addRefImage(e.target.files?.[0])} />
              </label>
            </div>
          </Field>
        </div>
        {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        <div className="sticky-actions">
          <button className="btn ghost" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save character"}</button>
        </div>
      </div>
    </>
  );
}
