import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, streamTurn, type Character, type Message, type Persona, type Plot, type Session, type TurnEvent } from "../api";
import { Avatar, confirmDelete, Icon, RoleplayText, Sheet } from "../components";
import { MemorySheet } from "./MemorySheet";
import { askConfirm, askText } from "../dialog";

interface Payload { session: Session; plot: Plot; persona: Persona | null; cast: Character[]; messages: Message[] }
interface LiveBeat { key: string; speaker: string; text: string }
interface Note { id: number; text: string; error?: boolean }

export function Chat() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<Payload | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [live, setLive] = useState<LiveBeat[]>([]);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [manualPick, setManualPick] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [peek, setPeek] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | "memory" | "menu">(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [mention, setMention] = useState<{ start: number; q: string; sel: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const noteId = useRef(0);

  const load = useCallback(async () => {
    const d = await api<Payload>(`/sessions/${id}`);
    setData(d);
    setMessages(d.messages);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const cast = useMemo(() => new Map((data?.cast ?? []).map((c) => [c.id, c])), [data]);
  const session = data?.session;
  const present = session?.state.scene.present ?? [];
  const userName = data?.persona?.name || "You";

  // keep scrolled to bottom while new text streams, unless the user scrolled up
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, live, status, notes]);
  function onScroll() {
    const el = scrollRef.current!;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  function note(t: string, error = false) {
    const nid = ++noteId.current;
    setNotes((n) => [...n, { id: nid, text: t, error }]);
    if (!error) setTimeout(() => setNotes((n) => n.filter((x) => x.id !== nid)), 9000);
  }

  async function updateSession(patch: Partial<Session>) {
    const s = await api<Session>(`/sessions/${id}`, { method: "PUT", body: patch });
    setData((d) => (d ? { ...d, session: s } : d));
  }

  async function run(action: "send" | "continue" | "regenerate", msg?: string) {
    if (busy) return;
    setBusy(true);
    setNotes([]);
    stick.current = true;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const speakers = session?.speaker_mode === "manual" && manualPick.length ? manualPick : undefined;
    try {
      await streamTurn(id!, { action, text: msg, speakers }, (e: TurnEvent) => {
        switch (e.type) {
          case "status": setStatus(e.text); break;
          case "user_message": setMessages((m) => [...m, e.message]); break;
          case "message_updated": setMessages((m) => m.map((x) => (x.id === e.message.id ? e.message : x))); break;
          case "removed": setMessages((m) => m.filter((x) => !e.ids.includes(x.id))); break;
          case "beat_start": setStatus(""); setLive((l) => [...l, { key: e.key, speaker: e.speaker, text: "" }]); break;
          case "delta": setLive((l) => l.map((b) => (b.key === e.key ? { ...b, text: b.text + e.text } : b))); break;
          case "beat_end":
            setLive((l) => l.filter((b) => b.key !== e.key));
            if (e.message) setMessages((m) => [...m, e.message!]);
            break;
          case "notice": note(e.text); break;
          case "error": note(e.text, true); break;
          case "done": break;
        }
      }, ctrl.signal);
    } catch (e) {
      if (!ctrl.signal.aborted) note((e as Error).message, true);
    } finally {
      setBusy(false);
      setStatus("");
      setLive([]);
      abortRef.current = null;
      if (ctrl.signal.aborted) setTimeout(load, 600); // pick up any partial text the server saved
      api<Payload>(`/sessions/${id}`).then((d) => setData((old) => (old ? { ...old, session: d.session } : d))).catch(() => {});
    }
  }

  function send() {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    setMention(null);
    run("send", t);
  }

  function stop() {
    abortRef.current?.abort();
  }

  // ----- @mentions -----
  function onTextChange(v: string) {
    setText(v);
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? v.length;
    const before = v.slice(0, caret);
    const m = /(^|\s)@([\p{L}\p{N}]*)$/u.exec(before);
    setMention(m ? { start: caret - m[2].length - 1, q: m[2].toLowerCase(), sel: 0 } : null);
  }
  const mentionOptions = mention ? (data?.cast ?? []).filter((c) => c.name.toLowerCase().includes(mention.q)).slice(0, 6) : [];
  function pickMention(c: Character) {
    if (!mention) return;
    const caret = taRef.current?.selectionStart ?? text.length;
    const first = c.name.split(/\s+/)[0];
    const v = text.slice(0, mention.start) + "@" + first + " " + text.slice(caret);
    setText(v);
    setMention(null);
    requestAnimationFrame(() => taRef.current?.focus());
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && mentionOptions.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMention({ ...mention, sel: (mention.sel + 1) % mentionOptions.length }); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMention({ ...mention, sel: (mention.sel - 1 + mentionOptions.length) % mentionOptions.length }); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(mentionOptions[mention.sel]); return; }
      if (e.key === "Escape") { setMention(null); return; }
    }
    // Enter sends on desktop; on touch devices Enter makes a new line (send with the button).
    if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
      e.preventDefault();
      send();
    }
  }
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [text]);

  // ----- message actions -----
  async function saveEdit(m: Message) {
    const content = editText.trim();
    if (!content) return;
    const updated = await api<Message>(`/messages/${m.id}`, { method: "PUT", body: { content } });
    setMessages((list) => list.map((x) => (x.id === m.id ? updated : x)));
    setEditing(null);
    const isLastUser = m.kind === "user" && !messages.some((x) => x.seq > m.seq && x.kind === "user");
    if (isLastUser && messages[messages.length - 1]?.id !== m.id && (await askConfirm("Regenerate the responses to your edited message?"))) run("regenerate");
  }
  async function del(m: Message) {
    if (!(await confirmDelete("this message"))) return;
    await api(`/messages/${m.id}`, { method: "DELETE" });
    setMessages((list) => list.filter((x) => x.id !== m.id));
  }

  // ----- search -----
  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) return setResults([]);
    const t = setTimeout(() => api<Message[]>(`/sessions/${id}/search?q=${encodeURIComponent(query.trim())}`).then(setResults), 250);
    return () => clearTimeout(t);
  }, [query, searchOpen, id]);
  function jump(mid: string) {
    setHighlight(mid);
    stick.current = false;
    document.getElementById(`m-${mid}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlight(null), 2500);
  }

  if (!data || !session) return null;
  const lastTurnId = [...messages].reverse().find((m) => m.turn_id)?.turn_id;
  const canRegenerate = !busy && !!lastTurnId;
  const manual = session.speaker_mode === "manual";
  const advanced = session.intelligence === "advanced";

  function speakerLabel(speaker: string) {
    if (speaker === "narrator") return { name: "Narrator", avatar: null };
    const c = cast.get(speaker);
    return { name: c?.name ?? "…", avatar: c?.avatar ?? null };
  }

  return (
    <div className="chat">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav(`/plots/${data.plot.id}`)} aria-label="Back">{Icon.back}</button>
        <div className="title">
          <h1>{data.plot.title}</h1>
          <div className="sub">{session.title}{session.state.scene.location ? ` · ${session.state.scene.location}` : ""}</div>
        </div>
        <button className={`icon-btn ${searchOpen ? "on" : ""}`} onClick={() => { setSearchOpen((v) => !v); setQuery(""); }} aria-label="Search" title="Search">{Icon.search}</button>
        <button className="icon-btn" onClick={() => setPanel("memory")} aria-label="Memory" title="Memory & character states">{Icon.brain}</button>
        <button className="icon-btn" onClick={() => setPanel("menu")} aria-label="More">{Icon.dots}</button>
      </div>
      {searchOpen && (
        <div>
          <div className="search-bar">
            <input className="input" autoFocus placeholder="Search this story…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {results.length > 0 && (
            <div className="search-results">
              {results.map((r) => (
                <button key={r.id} onClick={() => jump(r.id)}>
                  <b>{r.kind === "user" ? userName : r.kind === "narration" ? "Narrator" : cast.get(r.character_id ?? "")?.name}</b>: <RoleplayText text={r.content.length > 160 ? r.content.slice(0, 160) + "…" : r.content} highlight={query} />
                </button>
              ))}
            </div>
          )}
          {query.trim().length >= 2 && results.length === 0 && <p className="status-line">No matches.</p>}
        </div>
      )}

      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
        <div className="chat-inner">
          {messages.length === 0 && !busy && (
            <div className="empty">
              The story hasn't started. Write your first move below.<br />
              <span className="small-text">Put actions and thoughts in *asterisks*; words outside them are spoken aloud.</span>
            </div>
          )}
          {messages.map((m) => {
            const isEditing = editing === m.id;
            const tools = !busy && !isEditing && (
              <div className="tools">
                <button className="icon-btn" title="Edit" onClick={() => { setEditing(m.id); setEditText(m.content); }}>{Icon.edit}</button>
                <button className="icon-btn" title="Delete" onClick={() => del(m)}>{Icon.trash}</button>
                {m.kind === "user" && (m.private_note || m.perceived) && (
                  <button className={`icon-btn ${peek === m.id ? "on" : ""}`} title="What the characters perceived" onClick={() => setPeek(peek === m.id ? null : m.id)}>{Icon.lock}</button>
                )}
                {m.turn_id === lastTurnId && m.id === messages[messages.length - 1].id && (
                  <button className="icon-btn" title="Regenerate responses" onClick={() => run("regenerate")}>{Icon.redo}</button>
                )}
              </div>
            );
            const body = isEditing ? (
              <div className="edit-box">
                <textarea className="input" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                <div className="row" style={{ marginTop: 6, justifyContent: "flex-end" }}>
                  <button className="btn small ghost" onClick={() => setEditing(null)}>Cancel</button>
                  <button className="btn small primary" onClick={() => saveEdit(m)}>Save</button>
                </div>
              </div>
            ) : null;
            const hl = highlight === m.id ? " highlight" : "";
            if (m.kind === "narration") {
              return (
                <div key={m.id} id={`m-${m.id}`} className={`msg narr${hl}`}>
                  <div className="body" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {body ?? <div className="bubble text"><RoleplayText text={m.content.replace(/\*/g, "")} highlight={query || undefined} /></div>}
                    {tools}
                  </div>
                </div>
              );
            }
            if (m.kind === "user") {
              return (
                <div key={m.id} id={`m-${m.id}`} className={`msg user${hl}`}>
                  <Avatar src={data.persona?.avatar} name={userName} size={36} />
                  <div className="body">
                    <div className="who"><span className="name">{userName}</span></div>
                    {body ?? <div className="bubble text"><RoleplayText text={m.content} highlight={query || undefined} /></div>}
                    {peek === m.id && (
                      <div className="private-peek">
                        <div><b>What others noticed:</b> {m.perceived ? <RoleplayText text={m.perceived} /> : "—"}</div>
                        {m.private_note && <div style={{ marginTop: 4 }}><b>Private (only you):</b> {m.private_note}</div>}
                      </div>
                    )}
                    {tools}
                  </div>
                </div>
              );
            }
            const c = cast.get(m.character_id ?? "");
            return (
              <div key={m.id} id={`m-${m.id}`} className={`msg char${hl}`}>
                <Avatar src={c?.avatar} name={c?.name ?? "?"} size={42} />
                <div className="body">
                  <div className="who"><span className="name">{c?.name ?? "Removed character"}</span></div>
                  {body ?? <div className="bubble text"><RoleplayText text={m.content} highlight={query || undefined} /></div>}
                  {tools}
                </div>
              </div>
            );
          })}

          {live.map((b) => {
            const s = speakerLabel(b.speaker);
            if (b.speaker === "narrator") {
              return (
                <div key={b.key} className="msg narr">
                  <div className="bubble text">{b.text ? <RoleplayText text={b.text.replace(/\*/g, "")} /> : <span className="typing"><i /><i /><i /></span>}</div>
                </div>
              );
            }
            return (
              <div key={b.key} className="msg char">
                <Avatar src={s.avatar} name={s.name} size={42} />
                <div className="body">
                  <div className="who"><span className="name">{s.name}</span>{!b.text && <span className="small-text faint">is thinking…</span>}</div>
                  <div className="bubble text">{b.text ? <RoleplayText text={b.text} /> : <span className="typing"><i /><i /><i /></span>}</div>
                </div>
              </div>
            );
          })}
          {status && <div className="status-line"><span className="typing"><i /><i /><i /></span> {status}</div>}
          {notes.map((n) => <div key={n.id} className={`notice ${n.error ? "error" : ""}`}>{n.text}</div>)}
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <div className="bar">
            <div className="seg" title="Who responds">
              <button className={!manual ? "on" : ""} onClick={() => updateSession({ speaker_mode: "auto" })}>Auto</button>
              <button className={manual ? "on" : ""} onClick={() => updateSession({ speaker_mode: "manual" })}>Manual</button>
            </div>
            <button className={`chip plain ${advanced ? "on" : ""}`} onClick={() => updateSession({ intelligence: advanced ? "normal" : "advanced" })} title="Advanced intelligence: deeper reasoning, slower, costs more">
              {advanced ? "✦ Advanced" : "Normal"}
            </button>
            {manual && (data.cast.length ? data.cast.map((c) => (
              <button key={c.id} className={`chip ${manualPick.includes(c.id) ? "on" : ""} ${present.includes(c.id) ? "" : "absent"}`}
                onClick={() => setManualPick((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                title={present.includes(c.id) ? "Present" : "Not in the scene (will enter)"}>
                <Avatar src={c.avatar} name={c.name} size={22} />{c.name.split(/\s+/)[0]}
              </button>
            )) : <span className="small-text faint">No characters in this plot.</span>)}
            <span className="spacer" />
            <button className="chip plain" disabled={busy} onClick={() => run("continue")} title="Let the scene continue without you saying anything">Continue ›</button>
            {canRegenerate && <button className="chip plain" onClick={() => run("regenerate")} title="Regenerate the last responses">↻ Retry</button>}
          </div>
          {manual && manualPick.length === 0 && <div className="small-text faint" style={{ margin: "0 0 6px 4px" }}>Manual mode: tap who should respond (none selected = automatic for this message).</div>}
          <div className="box" style={{ position: "relative" }}>
            {mention && mentionOptions.length > 0 && (
              <div className="mention-pop">
                {mentionOptions.map((c, i) => (
                  <button key={c.id} className={i === mention.sel ? "sel" : ""} onMouseDown={(e) => { e.preventDefault(); pickMention(c); }}>
                    <Avatar src={c.avatar} name={c.name} size={24} />{c.name}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={taRef}
              rows={1}
              value={text}
              placeholder={`*Your action or thought* What you say… (@ to address someone)`}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={onKey}
            />
            {busy ? (
              <button className="send-btn stop" onClick={stop} aria-label="Stop">{Icon.stop}</button>
            ) : (
              <button className="send-btn" onClick={send} disabled={!text.trim()} aria-label="Send">{Icon.send}</button>
            )}
          </div>
        </div>
      </div>

      {panel === "memory" && <MemorySheet sessionId={id!} cast={data.cast} userName={userName} onClose={() => { setPanel(null); load(); }} />}
      {panel === "menu" && (
        <Sheet title="Story" onClose={() => setPanel(null)}>
          <div className="list">
            <div className="list-item" onClick={async () => {
              const title = await askText("Rename this save", session.title);
              if (title) await updateSession({ title });
            }}>{Icon.edit}<div className="grow">Rename save</div></div>
            <div className="list-item" onClick={async () => {
              const title = await askText("Name for the branch", `${session.title} — Alternate`);
              if (title === null) return;
              const s = await api<Session>(`/sessions/${id}/duplicate`, { body: { title } });
              setPanel(null);
              nav(`/s/${s.id}`);
            }}>{Icon.branch}<div className="grow">Branch from here<div className="desc">Copy this save (history, memories, relationships) to explore other choices.</div></div></div>
            <div className="list-item" onClick={() => nav(`/plots/${data.plot.id}`)}>{Icon.book}<div className="grow">Other saves of this plot</div></div>
          </div>
          <h3 className="section-title">Usage</h3>
          <div className="card small-text">
            {session.usage.calls ?? 0} AI steps in this story so far. Free — it runs on your Claude plan.
          </div>
          <h3 className="section-title">How to write</h3>
          <div className="card small-text" style={{ lineHeight: 1.6 }}>
            <div><b>*I open the door.*</b> — an action everyone present can see.</div>
            <div><b>*I think she's lying.*</b> — a private thought. No character can read it.</div>
            <div><b>Hello, Akari.</b> — words outside asterisks are spoken aloud.</div>
            <div><b>@Akari</b> — address someone directly.</div>
            <div style={{ marginTop: 6 }} className="muted">Tap the lock on your message to see what the characters perceived.</div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
