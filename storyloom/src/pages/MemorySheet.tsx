import { useEffect, useState } from "react";
import { api, type Character, type CharacterState, type Memory, type SessionState } from "../api";
import { Avatar, Icon, Sheet } from "../components";

interface Data { state: SessionState; summary: string; memories: Memory[] }

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function MemorySheet({ sessionId, cast, userName, onClose }: { sessionId: string; cast: Character[]; userName: string; onClose: () => void }) {
  const [d, setD] = useState<Data | null>(null);
  const [tab, setTab] = useState<"scene" | "people" | "memories" | "summary">("scene");
  const [dirty, setDirty] = useState(false);
  const [newMem, setNewMem] = useState("");
  const byId = new Map(cast.map((c) => [c.id, c]));
  const load = () => api<Data>(`/sessions/${sessionId}/memory`).then((x) => { setD(x); setDirty(false); });
  useEffect(() => {
    load();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!d) return <Sheet title="Memory" onClose={onClose}><p className="muted">Loading…</p></Sheet>;

  const setState = (fn: (s: SessionState) => SessionState) => { setD({ ...d, state: fn(structuredClone(d.state)) }); setDirty(true); };
  const setChar = (id: string, patch: Partial<CharacterState>) => setState((s) => {
    s.characters[id] = { ...emptyState(), ...s.characters[id], ...patch };
    return s;
  });
  async function saveState() {
    await api(`/sessions/${sessionId}/state`, { method: "PUT", body: { state: d!.state, summary: d!.summary } });
    load();
  }
  async function patchMem(m: Memory, patch: Partial<Memory>) {
    await api(`/memories/${m.id}`, { method: "PUT", body: patch });
    load();
  }

  return (
    <Sheet title="Memory" onClose={onClose} actions={dirty && <button className="btn small primary" onClick={saveState}>Save</button>}>
      <p className="small-text muted" style={{ marginTop: 0 }}>This is what the story remembers for this save only. Fix anything that's wrong — the characters will use your corrections.</p>
      <div className="seg" style={{ marginBottom: 14 }}>
        {(["scene", "people", "memories", "summary"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t === "people" ? "Characters" : t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === "scene" && (
        <div className="form">
          <div className="field"><label>Location</label><input className="input" value={d.state.scene.location} onChange={(e) => setState((s) => ({ ...s, scene: { ...s.scene, location: e.target.value } }))} /></div>
          <div className="field"><label>Time</label><input className="input" value={d.state.scene.time} onChange={(e) => setState((s) => ({ ...s, scene: { ...s.scene, time: e.target.value } }))} /></div>
          <div className="field"><label>Scene description</label><textarea className="input" value={d.state.scene.description} onChange={(e) => setState((s) => ({ ...s, scene: { ...s.scene, description: e.target.value } }))} /></div>
          <div className="field">
            <label>Who is here with {userName}</label>
            <div className="cast-pick">
              {cast.map((c) => {
                const here = d.state.scene.present.includes(c.id);
                return (
                  <div key={c.id} className={`cast-row ${here ? "on" : ""}`} onClick={() => setState((s) => ({ ...s, scene: { ...s.scene, present: here ? s.scene.present.filter((x) => x !== c.id) : [...s.scene.present, c.id] } }))} style={{ cursor: "pointer" }}>
                    <Avatar src={c.avatar} name={c.name} size={32} /><div className="grow">{c.name}</div><span className="pill">{here ? "Present" : "Away"}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="field"><label>Open story threads (one per line)</label><textarea className="input" value={d.state.threads.join("\n")} onChange={(e) => setState((s) => ({ ...s, threads: lines(e.target.value) }))} /></div>
        </div>
      )}

      {tab === "people" && cast.map((c) => {
        const st = { ...emptyState(), ...d.state.characters[c.id] };
        return (
          <details key={c.id} className="adv" style={{ marginBottom: 10 }}>
            <summary><Avatar src={c.avatar} name={c.name} size={28} /> {c.name} <span className="spacer" /><span className="pill">{st.mood || "—"}</span></summary>
            <div className="form">
              <Meter label={`Trust in ${userName}`} v={st.trust_user} onChange={(v) => setChar(c.id, { trust_user: v })} />
              <Meter label={`Affection for ${userName}`} v={st.affection_user} onChange={(v) => setChar(c.id, { affection_user: v })} />
              <div className="field"><label>Mood</label><input className="input" value={st.mood} onChange={(e) => setChar(c.id, { mood: e.target.value })} /></div>
              <div className="field"><label>How they see {userName}</label><textarea className="input" value={st.user_view} onChange={(e) => setChar(c.id, { user_view: e.target.value })} /></div>
              <div className="field"><label>Current goals (one per line)</label><textarea className="input" value={st.goals.join("\n")} onChange={(e) => setChar(c.id, { goals: lines(e.target.value) })} /></div>
              <div className="field"><label>Plans in motion (secret)</label><textarea className="input" value={st.plans.join("\n")} onChange={(e) => setChar(c.id, { plans: lines(e.target.value) })} /></div>
              <div className="field"><label>Private intentions</label><textarea className="input" value={st.intentions} onChange={(e) => setChar(c.id, { intentions: e.target.value })} /></div>
              <div className="field"><label>Knows / believes / suspects (one per line)</label><textarea className="input" rows={4} value={st.beliefs.join("\n")} onChange={(e) => setChar(c.id, { beliefs: lines(e.target.value) })} /></div>
              {cast.filter((o) => o.id !== c.id).map((o) => (
                <div className="field" key={o.id}><label>Sees {o.name} as</label><input className="input" value={st.relationships[o.id] ?? ""} onChange={(e) => setChar(c.id, { relationships: { ...st.relationships, [o.id]: e.target.value } })} /></div>
              ))}
              <div className="field"><label>Their memory of older events</label><textarea className="input" rows={4} value={st.perspective_summary} onChange={(e) => setChar(c.id, { perspective_summary: e.target.value })} /></div>
            </div>
          </details>
        );
      })}

      {tab === "memories" && (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Add a memory (e.g. Akari promised to keep the secret)" value={newMem} onChange={(e) => setNewMem(e.target.value)} />
            <button className="btn small primary" disabled={!newMem.trim()} onClick={async () => {
              await api(`/sessions/${sessionId}/memories`, { body: { content: newMem, importance: 3, known_by: d.state.scene.present } });
              setNewMem("");
              load();
            }}>Add</button>
          </div>
          {d.memories.length === 0 && <div className="empty">No memories yet. They appear as the story unfolds.</div>}
          {[...d.memories].reverse().map((m) => (
            <div className="card" key={m.id}>
              <textarea className="input" defaultValue={m.content} onBlur={(e) => e.target.value.trim() !== m.content && patchMem(m, { content: e.target.value.trim() })} style={{ minHeight: 60 }} />
              <div className="row" style={{ marginTop: 8 }}>
                <span className="pill gold">{m.kind}</span>
                <select className="input" style={{ width: "auto", padding: "4px 8px", fontSize: 13 }} value={m.importance} onChange={(e) => patchMem(m, { importance: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((i) => <option key={i} value={i}>Importance {i}</option>)}
                </select>
                <button className={`btn small ${m.pinned ? "primary" : "ghost"}`} onClick={() => patchMem(m, { pinned: !m.pinned })}>{m.pinned ? "Pinned" : "Pin"}</button>
                <span className="spacer" />
                <button className="icon-btn" onClick={async () => { if (window.confirm("Delete this memory?")) { await api(`/memories/${m.id}`, { method: "DELETE" }); load(); } }}>{Icon.trash}</button>
              </div>
              <div className="small-text muted" style={{ marginTop: 8 }}>Known by:</div>
              <div className="row" style={{ marginTop: 4 }}>
                {cast.map((c) => {
                  const knows = m.known_by.includes(c.id);
                  return (
                    <button key={c.id} className={`chip ${knows ? "on" : ""}`} onClick={() => patchMem(m, { known_by: knows ? m.known_by.filter((x) => x !== c.id) : [...m.known_by, c.id] })}>
                      <Avatar src={c.avatar} name={c.name} size={20} />{c.name.split(/\s+/)[0]}
                    </button>
                  );
                })}
                {m.known_by.length === 0 && <span className="small-text faint">nobody (only you)</span>}
              </div>
              {m.known_by.some((id) => !byId.has(id)) && <div className="small-text faint">Includes removed characters.</div>}
            </div>
          ))}
        </>
      )}

      {tab === "summary" && (
        <div className="field">
          <label>Story outline (older events, rolled up automatically)</label>
          <textarea className="input" rows={14} value={d.summary} placeholder="Appears once the story gets long." onChange={(e) => { setD({ ...d, summary: e.target.value }); setDirty(true); }} />
          <div className="hint">Used by the director and narrator. Each character also has their own version (Characters tab → “Their memory of older events”).</div>
        </div>
      )}
    </Sheet>
  );
}

function Meter({ label, v, onChange }: { label: string; v: number; onChange: (v: number) => void }) {
  return (
    <div className="field">
      <label>{label}: {v > 0 ? `+${v}` : v}</label>
      <input type="range" min={-10} max={10} value={v} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
    </div>
  );
}

function emptyState(): CharacterState {
  return { mood: "", goals: [], plans: [], intentions: "", beliefs: [], trust_user: 0, affection_user: 0, user_view: "", relationships: {}, perspective_summary: "" };
}
