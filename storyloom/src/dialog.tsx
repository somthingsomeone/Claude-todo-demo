// In-app replacements for window.prompt / window.confirm (often blocked inside an embedded Artifact).
import { useEffect, useRef, useState } from "react";

type Req =
  | { kind: "prompt"; title: string; value: string; resolve: (v: string | null) => void }
  | { kind: "confirm"; title: string; danger: boolean; resolve: (v: boolean) => void };

let push: (r: Req) => void = () => {};

export function askText(title: string, value = ""): Promise<string | null> {
  return new Promise((resolve) => push({ kind: "prompt", title, value, resolve }));
}
export function askConfirm(title: string, danger = false): Promise<boolean> {
  return new Promise((resolve) => push({ kind: "confirm", title, danger, resolve }));
}

export function DialogHost() {
  const [req, setReq] = useState<Req | null>(null);
  const [val, setVal] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    push = (r) => {
      setReq(r);
      if (r.kind === "prompt") setVal(r.value);
    };
  }, []);
  useEffect(() => {
    if (req?.kind === "prompt") setTimeout(() => input.current?.select(), 30);
  }, [req]);
  if (!req) return null;
  const close = (ok: boolean) => {
    if (req.kind === "prompt") req.resolve(ok ? val.trim() || null : null);
    else req.resolve(ok);
    setReq(null);
  };
  return (
    <>
      <div className="sheet-backdrop" style={{ zIndex: 80 }} onClick={() => close(false)} />
      <div className="dialog" role="dialog" aria-label={req.title}>
        <p className="dialog-title">{req.title}</p>
        {req.kind === "prompt" && (
          <input ref={input} className="input" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") close(true); if (e.key === "Escape") close(false); }} />
        )}
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn ghost" onClick={() => close(false)}>Cancel</button>
          <button className={`btn ${req.kind === "confirm" && req.danger ? "danger" : "primary"}`} onClick={() => close(true)}>
            {req.kind === "confirm" && req.danger ? "Delete" : "OK"}
          </button>
        </div>
      </div>
    </>
  );
}
