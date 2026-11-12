import { useRef, useState, type ReactNode } from "react";
import { uploadImage } from "./api";
import { askConfirm } from "./dialog";

// ---------- icons (inline SVG, no icon library needed) ----------
const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icon = {
  book: <svg viewBox="0 0 24 24" {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></svg>,
  people: <svg viewBox="0 0 24 24" {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16.5 14.5c2.4.2 4.2 1.9 5 4.5" /></svg>,
  mask: <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></svg>,
  gear: <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  plus: <svg viewBox="0 0 24 24" {...p}><path d="M12 5v14M5 12h14" /></svg>,
  back: <svg viewBox="0 0 24 24" {...p}><path d="M15 18l-6-6 6-6" /></svg>,
  send: <svg viewBox="0 0 24 24" {...p} strokeWidth={2.2}><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
  stop: <svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2" /></svg>,
  redo: <svg viewBox="0 0 24 24" {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>,
  edit: <svg viewBox="0 0 24 24" {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  trash: <svg viewBox="0 0 24 24" {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>,
  search: <svg viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  brain: <svg viewBox="0 0 24 24" {...p}><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 4V3z" /><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 4V3z" /></svg>,
  forward: <svg viewBox="0 0 24 24" {...p}><path d="M5 5l7 7-7 7M13 5l7 7-7 7" /></svg>,
  copy: <svg viewBox="0 0 24 24" {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>,
  branch: <svg viewBox="0 0 24 24" {...p}><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10M18 10c0 4-6 3-11.5 7" /></svg>,
  lock: <svg viewBox="0 0 24 24" {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  close: <svg viewBox="0 0 24 24" {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  image: <svg viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>,
  dots: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>,
};

export function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden>
      {src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : (name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

/** A portrait/cover image that hides itself if it can't load. */
export function Img({ src, className, fallback }: { src: string; className?: string; fallback: ReactNode }) {
  const [broken, setBroken] = useState(false);
  return broken ? <>{fallback}</> : <img className={className} src={src} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className="input" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function ImagePicker({ value, onChange, shape = "square", label = "Choose image", maxSize = 1024 }: {
  value: string | null; onChange: (url: string | null) => void; shape?: "square" | "round" | "wide"; label?: string; maxSize?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadImage(f, maxSize));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <div className="image-picker">
      <div className={`preview ${shape === "square" ? "" : shape}`} onClick={() => ref.current?.click()} role="button" aria-label={label}>
        {busy ? <span className="typing"><i /><i /><i /></span> : value ? <img src={value} alt="" /> : Icon.image}
      </div>
      <div className="row">
        <button type="button" className="btn small" onClick={() => ref.current?.click()} disabled={busy}>{value ? "Change" : label}</button>
        {value && <button type="button" className="btn small ghost danger" onClick={() => onChange(null)}>Remove</button>}
        {err && <span className="small-text" style={{ color: "var(--danger)" }}>{err}</span>}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/** Render roleplay text: *actions* in italic, the rest as spoken text. Not Markdown. */
export function RoleplayText({ text, highlight }: { text: string; highlight?: string }) {
  const parts: ReactNode[] = [];
  const re = /\*+([^*]+)\*+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<span key={i++}>{mark(text.slice(last, m.index), highlight)}</span>);
    parts.push(<em key={i++} className="act">{mark(m[1], highlight)}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={i++}>{mark(text.slice(last).replace(/^\*+/, ""), highlight)}</span>);
  return <>{parts}</>;
}

function mark(s: string, q?: string): ReactNode {
  if (!q) return s;
  const idx = s.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return s;
  return <>{s.slice(0, idx)}<mark>{s.slice(idx, idx + q.length)}</mark>{mark(s.slice(idx + q.length), q)}</>;
}

export function Sheet({ title, onClose, children, actions }: { title: string; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          {actions}
          <button className="icon-btn" onClick={onClose} aria-label="Close">{Icon.close}</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

export function TopBar({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="topbar">
      {onBack && <button className="icon-btn" onClick={onBack} aria-label="Back">{Icon.back}</button>}
      <div className="title">
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function confirmDelete(what: string): Promise<boolean> {
  return askConfirm(`Delete ${what}? This can't be undone.`, true);
}
