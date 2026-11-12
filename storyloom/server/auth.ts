// Owner-only access: one password (APP_PASSWORD env var) -> signed, HttpOnly cookie.
import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getSetting, setSetting } from "./db.ts";

const COOKIE = "storyloom_auth";
const MAX_AGE_DAYS = 90;

function secret(): string {
  let s = getSetting("cookie_secret");
  if (!s) {
    s = crypto.randomBytes(32).toString("hex");
    setSetting("cookie_secret", s);
  }
  // Changing APP_PASSWORD invalidates every existing login.
  return s + ":" + crypto.createHash("sha256").update(process.env.APP_PASSWORD ?? "").digest("hex");
}

export function authRequired(): boolean {
  return !!process.env.APP_PASSWORD;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(): string {
  const exp = Date.now() + MAX_AGE_DAYS * 86400_000;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return expected.length === sig.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

function readCookie(req: Request): string | undefined {
  const raw = req.headers.cookie ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function isLoggedIn(req: Request): boolean {
  return !authRequired() || verifyToken(readCookie(req));
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (isLoggedIn(req)) return next();
  res.status(401).json({ error: "Please log in." });
}

const attempts = new Map<string, { count: number; until: number }>();

export function login(req: Request, res: Response) {
  const ip = req.ip ?? "?";
  const a = attempts.get(ip);
  if (a && a.count >= 5 && a.until > Date.now()) {
    return res.status(429).json({ error: "Too many attempts. Wait a minute and try again." });
  }
  const pw = String(req.body?.password ?? "");
  const expected = process.env.APP_PASSWORD ?? "";
  const ok = expected.length > 0 && pw.length === expected.length && crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(expected));
  if (!ok) {
    const cur = a && a.until > Date.now() ? a : { count: 0, until: Date.now() + 60_000 };
    cur.count++;
    attempts.set(ip, cur);
    return res.status(401).json({ error: "Wrong password." });
  }
  attempts.delete(ip);
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(makeToken())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_DAYS * 86400}${secure ? "; Secure" : ""}`);
  res.json({ ok: true });
}

export function logout(_req: Request, res: Response) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
}
