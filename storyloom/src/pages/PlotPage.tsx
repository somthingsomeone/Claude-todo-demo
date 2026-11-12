import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Character, type Persona, type Plot, type PlotCharacter, type Session } from "../api";
import { Avatar, confirmDelete, Icon } from "../components";

type Full = Plot & { characters: PlotCharacter[]; sessions: Session[] };

export function PlotPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [plot, setPlot] = useState<Full | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [err, setErr] = useState("");
  const load = () => api<Full>(`/plots/${id}`).then(setPlot).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
    api<Character[]>("/characters").then(setChars);
    api<Persona[]>("/personas").then(setPersonas);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <div className="page"><p>{err}</p></div>;
  if (!plot) return null;
  const byId = new Map(chars.map((c) => [c.id, c]));
  const persona = personas.find((p) => p.id === plot.persona_id);

  async function newSession() {
    const title = window.prompt("Name this save", plot!.sessions.length ? `New Beginning ${plot!.sessions.length + 1}` : "Main Story");
    if (title === null) return;
    const s = await api<Session>(`/plots/${id}/sessions`, { body: { title } });
    nav(`/s/${s.id}`);
  }

  return (
    <>
      <div className="plot-hero">
        {plot.cover ? <img src={plot.cover} alt="" /> : <div className="cover-fallback" />}
        <div className="shade" />
        <button className="icon-btn back" onClick={() => nav("/")} aria-label="Back">{Icon.back}</button>
        <div className="inner">
          <h1>{plot.title}</h1>
          {plot.description && <p className="lead" style={{ margin: "8px 0 0", color: "#ddd6ca" }}>{plot.description}</p>}
        </div>
      </div>
      <div className="page" style={{ paddingTop: 12 }}>
        <div className="row">
          <button className="btn primary" onClick={newSession}>{Icon.plus}New story</button>
          <button className="btn" onClick={() => nav(`/plots/${id}/edit`)}>{Icon.edit}Edit plot</button>
          <button className="btn ghost" onClick={async () => {
            const p = await api<Plot>(`/plots/${id}/duplicate`, { body: {} });
            nav(`/plots/${p.id}`);
          }}>{Icon.copy}Duplicate</button>
          <span className="spacer" />
          <button className="btn ghost danger" onClick={async () => {
            if (!confirmDelete(`“${plot.title}” with all its saves and memories (characters are kept)`)) return;
            await api(`/plots/${id}`, { method: "DELETE" });
            nav("/");
          }}>{Icon.trash}</button>
        </div>

        <h3 className="section-title">Saves</h3>
        {plot.sessions.length === 0 ? (
          <div className="empty">No stories yet. Tap <b>New story</b> to begin.</div>
        ) : (
          <div className="list">
            {plot.sessions.map((s) => (
              <div key={s.id} className="list-item" onClick={() => nav(`/s/${s.id}`)}>
                <div className="grow">
                  <div className="name">{s.title}</div>
                  <div className="desc">{s.last_message ? s.last_message.replace(/\*/g, "") : "Not started"}</div>
                  <div className="small-text faint" style={{ marginTop: 3 }}>{s.message_count} messages · {new Date(s.updated_at).toLocaleString()}</div>
                </div>
                <button className="icon-btn" title="Branch (duplicate this save)" onClick={async (e) => {
                  e.stopPropagation();
                  const title = window.prompt("Name for the copy", `${s.title} — Alternate`);
                  if (title === null) return;
                  await api(`/sessions/${s.id}/duplicate`, { body: { title } });
                  load();
                }}>{Icon.branch}</button>
                <button className="icon-btn" title="Rename" onClick={async (e) => {
                  e.stopPropagation();
                  const title = window.prompt("Rename save", s.title);
                  if (!title) return;
                  await api(`/sessions/${s.id}`, { method: "PUT", body: { title } });
                  load();
                }}>{Icon.edit}</button>
                <button className="icon-btn" title="Delete" onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirmDelete(`the save “${s.title}”`)) return;
                  await api(`/sessions/${s.id}`, { method: "DELETE" });
                  load();
                }}>{Icon.trash}</button>
              </div>
            ))}
          </div>
        )}

        <h3 className="section-title">Cast</h3>
        {plot.characters.length === 0 ? <div className="empty">No characters in this plot yet. Use <b>Edit plot</b> to add some.</div> : (
          <div className="char-grid">
            {plot.characters.map((pc) => {
              const c = byId.get(pc.character_id);
              if (!c) return null;
              return (
                <div key={c.id} className="char-card" onClick={() => nav(`/characters/${c.id}`)}>
                  {c.avatar ? <img className="portrait" src={c.avatar} alt="" /> : <div className="portrait">{c.name[0]}</div>}
                  <div className="meta">
                    <div className="name">{c.name}</div>
                    <div className="desc">{pc.starts_present ? "In the opening scene" : "Appears later"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h3 className="section-title">You play</h3>
        {persona ? (
          <div className="list"><div className="list-item" onClick={() => nav(`/personas/${persona.id}`)}>
            <Avatar src={persona.avatar} name={persona.name} size={44} />
            <div className="grow"><div className="name">{persona.name}</div><div className="desc">{persona.role}</div></div>
          </div></div>
        ) : <p className="muted small-text">No persona chosen. Pick one in <b>Edit plot</b> (create it in the “Me” tab).</p>}

        {(plot.setting || plot.lore) && <>
          <h3 className="section-title">World</h3>
          {plot.setting && <p className="prose">{plot.setting}</p>}
          {plot.lore && <p className="prose muted">{plot.lore}</p>}
        </>}
      </div>
    </>
  );
}
