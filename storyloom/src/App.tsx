import { useEffect, useState, type FormEvent } from "react";
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api, setOnUnauthorized, type Character, type Persona, type Plot } from "./api";
import { Avatar, Icon } from "./components";
import { PlotEditor } from "./pages/PlotEditor";
import { PlotPage } from "./pages/PlotPage";
import { CharacterEditor } from "./pages/CharacterEditor";
import { PersonaEditor } from "./pages/PersonaEditor";
import { SettingsPage } from "./pages/Settings";
import { Chat } from "./pages/Chat";

export default function App() {
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    setOnUnauthorized(() => setAuth("out"));
    api<{ loggedIn: boolean }>("/auth").then((r) => setAuth(r.loggedIn ? "in" : "out")).catch(() => setAuth("out"));
  }, []);
  if (auth === "loading") return null;
  if (auth === "out") return <Login onDone={() => setAuth("in")} />;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WithTabs><PlotLibrary /></WithTabs>} />
        <Route path="/characters" element={<WithTabs><CharacterLibrary /></WithTabs>} />
        <Route path="/personas" element={<WithTabs><PersonaLibrary /></WithTabs>} />
        <Route path="/settings" element={<WithTabs><SettingsPage /></WithTabs>} />
        <Route path="/plots/new" element={<PlotEditor />} />
        <Route path="/plots/:id/edit" element={<PlotEditor />} />
        <Route path="/plots/:id" element={<PlotPage />} />
        <Route path="/characters/new" element={<CharacterEditor />} />
        <Route path="/characters/:id" element={<CharacterEditor />} />
        <Route path="/personas/new" element={<PersonaEditor />} />
        <Route path="/personas/:id" element={<PersonaEditor />} />
        <Route path="/s/:id" element={<Chat />} />
        <Route path="*" element={<WithTabs><PlotLibrary /></WithTabs>} />
      </Routes>
    </BrowserRouter>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/login", { body: { password: pw } });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <form className="box" onSubmit={submit}>
        <h1><span className="logo-mark">Story</span>loom</h1>
        <p className="lead">Your private storytelling world.</p>
        <input className="input" type="password" autoFocus placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <div style={{ height: 12 }} />
        <button className="btn primary" style={{ width: "100%" }} disabled={busy || !pw}>Enter</button>
        {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      </form>
    </div>
  );
}

function WithTabs({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <nav className="tabbar">
        <NavLink to="/" end>{Icon.book}Plots</NavLink>
        <NavLink to="/characters">{Icon.people}Characters</NavLink>
        <NavLink to="/personas">{Icon.mask}Me</NavLink>
        <NavLink to="/settings">{Icon.gear}Settings</NavLink>
      </nav>
    </>
  );
}

function PlotLibrary() {
  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const nav = useNavigate();
  useEffect(() => {
    api<Plot[]>("/plots").then(setPlots);
    api<Character[]>("/characters").then(setChars);
  }, []);
  const byId = new Map(chars.map((c) => [c.id, c]));
  return (
    <div className="page">
      <h1 className="hero-title"><span className="logo-mark">Story</span>loom</h1>
      <p className="lead">Your plots. Each one is its own world, with its own saves and memories.</p>
      {plots && (
        <div className="grid">
          {plots.map((p) => (
            <div key={p.id} className="plot-card" onClick={() => nav(`/plots/${p.id}`)}>
              {p.cover ? <img className="cover" src={p.cover} alt="" /> : <div className="cover-fallback"><span>{p.title[0]}</span></div>}
              <div className="shade" />
              <div className="info">
                <h2>{p.title}</h2>
                {p.description && <p>{p.description}</p>}
                <div className="row">
                  <div className="avatar-stack">
                    {(p.character_ids ?? []).slice(0, 5).map((id) => byId.get(id) && <Avatar key={id} src={byId.get(id)!.avatar} name={byId.get(id)!.name} size={26} />)}
                  </div>
                  <span className="small-text faint">{p.session_count ? `${p.session_count} save${p.session_count > 1 ? "s" : ""}` : "New"}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="plot-card new-card" onClick={() => nav("/plots/new")}>
            {Icon.plus}
            <span>New Plot</span>
          </div>
        </div>
      )}
      {plots && plots.length === 0 && (
        <p className="muted small-text" style={{ marginTop: 18 }}>
          Tip: create a few characters first (Characters tab), then make a Plot and add them to it.
        </p>
      )}
    </div>
  );
}

function CharacterLibrary() {
  const [chars, setChars] = useState<Character[] | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    api<Character[]>("/characters").then(setChars);
  }, []);
  return (
    <div className="page">
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="spacer">
          <h1 className="hero-title">Characters</h1>
          <p className="lead" style={{ marginBottom: 0 }}>Reusable across plots. Each plot keeps its own memories of them.</p>
        </div>
        <button className="btn primary" onClick={() => nav("/characters/new")}>{Icon.plus}New</button>
      </div>
      <div style={{ height: 20 }} />
      {chars && chars.length === 0 && <div className="empty">No characters yet.<br />Tap <b>New</b> to create your first one.</div>}
      <div className="char-grid">
        {chars?.map((c) => (
          <div key={c.id} className="char-card" onClick={() => nav(`/characters/${c.id}`)}>
            {c.avatar ? <img className="portrait" src={c.avatar} alt="" loading="lazy" /> : <div className="portrait">{c.name[0]}</div>}
            <div className="meta">
              <div className="name">{c.name}</div>
              <div className="desc">{c.tagline || c.personality}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonaLibrary() {
  const [list, setList] = useState<Persona[] | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    api<Persona[]>("/personas").then(setList);
  }, []);
  return (
    <div className="page narrow">
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="spacer">
          <h1 className="hero-title">My Personas</h1>
          <p className="lead" style={{ marginBottom: 0 }}>Who you play. Pick one per plot. The AI never writes for your persona.</p>
        </div>
        <button className="btn primary" onClick={() => nav("/personas/new")}>{Icon.plus}New</button>
      </div>
      <div style={{ height: 20 }} />
      {list && list.length === 0 && <div className="empty">No personas yet.</div>}
      {list && list.length > 0 && (
        <div className="list">
          {list.map((p) => (
            <div key={p.id} className="list-item" onClick={() => nav(`/personas/${p.id}`)}>
              <Avatar src={p.avatar} name={p.name} size={44} />
              <div className="grow">
                <div className="name">{p.name}</div>
                <div className="desc">{p.role || p.appearance || p.personality}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
