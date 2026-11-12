// Where data is kept. Inside a Claude Artifact: the artifact's own database, in the viewer's
// private area (data/users/<id>/...), which nobody else can read. Outside (local preview):
// the browser's localStorage, with a warning shown in the UI.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, unknown>;

export interface Store {
  kind: "claude" | "browser";
  list(coll: string, where?: [string, unknown]): Promise<{ id: string; data: Doc }[]>;
  get(coll: string, id: string): Promise<Doc | null>;
  set(coll: string, id: string, data: Doc): Promise<void>;
  del(coll: string, id: string): Promise<void>;
}

declare global {
  interface Window {
    claude?: { use(name: string): Promise<any> };
  }
}

export async function useCap<T = any>(name: string): Promise<T | null> {
  try {
    if (!window.claude?.use) return null;
    return (await window.claude.use(name)) as T | null;
  } catch {
    return null;
  }
}

/** Ids must be safe path segments. */
export function safeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_\-.~:@+]/g, "_");
}

export async function openStore(): Promise<Store> {
  const [db, user] = await Promise.all([useCap("db"), useCap("user")]);
  const uid: string | null = user ? await user.id().catch(() => null) : null;
  if (db && uid) {
    const root = db.doc(`data/users/${uid}/root`);
    const coll = (c: string) => root.collection(c);
    const retry = async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (e: any) {
        if (e?.code === "unavailable") {
          await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
          return fn();
        }
        throw e;
      }
    };
    return {
      kind: "claude",
      async list(c, where) {
        let q = coll(c);
        if (where) q = q.where(where[0], "==", where[1]);
        const snap = await retry(() => q.get()) as any;
        return snap.docs.map((d: any) => ({ id: d.id, data: d.data() as Doc }));
      },
      async get(c, id) {
        const s = await retry(() => coll(c).doc(safeId(id)).get()) as any;
        return s.exists ? (s.data() as Doc) : null;
      },
      set: (c, id, data) => retry(() => coll(c).doc(safeId(id)).set(JSON.parse(JSON.stringify(data)))),
      del: (c, id) => retry(() => coll(c).doc(safeId(id)).delete()),
    };
  }
  // Fallback: this browser only.
  const key = (c: string, id: string) => `storyloom:${c}:${safeId(id)}`;
  const ls = (() => {
    try {
      const t = "__sl_test";
      localStorage.setItem(t, "1");
      localStorage.removeItem(t);
      return localStorage;
    } catch {
      return null;
    }
  })();
  const mem = new Map<string, string>();
  const read = (k: string) => (ls ? ls.getItem(k) : mem.get(k) ?? null);
  return {
    kind: "browser",
    async list(c, where) {
      const out: { id: string; data: Doc }[] = [];
      const prefix = `storyloom:${c}:`;
      const keys = ls ? Object.keys(ls) : [...mem.keys()];
      for (const k of keys) {
        if (!k.startsWith(prefix)) continue;
        const data = JSON.parse(read(k) ?? "null") as Doc | null;
        if (!data) continue;
        if (where && data[where[0]] !== where[1]) continue;
        out.push({ id: k.slice(prefix.length), data });
      }
      return out;
    },
    async get(c, id) {
      const v = read(key(c, id));
      return v ? (JSON.parse(v) as Doc) : null;
    },
    async set(c, id, data) {
      const v = JSON.stringify(data);
      if (ls) ls.setItem(key(c, id), v);
      else mem.set(key(c, id), v);
    },
    async del(c, id) {
      if (ls) ls.removeItem(key(c, id));
      else mem.delete(key(c, id));
    },
  };
}
