import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getDb } from "../db/client";
import { resolveAdminByEmail } from "./admins";
import { resolveAuthMode } from "./auth-mode";
import type { Actor } from "./core";

export const authMode = () => resolveAuthMode(process.env);
const DEV_COOKIE = "dev_admin_id";

export async function supabaseServerClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* called from a page render; the proxy refreshes cookies instead */
        }
      },
    },
  });
}

export async function getCurrentAdmin(): Promise<Actor | null> {
  // Always decide per request, never at build time.
  await connection();
  const mode = authMode();
  if (mode === "disabled") return null;
  const db = await getDb();
  if (mode === "supabase") {
    const supabase = await supabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return null;
    return resolveAdminByEmail(db, data.user.email, data.user.id, process.env.ADMIN_OWNER_EMAIL ?? null);
  }
  const id = (await cookies()).get(DEV_COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db.query<{ id: string; email: string; display_name: string; role: Actor["role"] }>(
    `select id, email, display_name, role from admin_users where id = $1 and is_active`,
    [id],
  );
  return row ? { id: row.id, email: row.email, displayName: row.display_name, role: row.role } : null;
}

export async function requireAdmin(opts: { owner?: boolean } = {}): Promise<Actor> {
  const actor = await getCurrentAdmin();
  if (!actor) redirect("/admin/login");
  if (opts.owner && actor.role !== "owner") redirect("/admin?err=" + encodeURIComponent("هذه الصفحة للمالك فقط."));
  return actor;
}

/** Local development only: sign in as a demo owner without a password. */
export async function devSignIn() {
  if (authMode() !== "dev") throw new Error("Dev login is disabled");
  const db = await getDb();
  let [row] = await db.query<{ id: string }>(`select id from admin_users where email = 'dev-owner@example.com'`);
  if (!row) {
    [row] = await db.query<{ id: string }>(
      `insert into admin_users (email, display_name, role) values ('dev-owner@example.com', 'مالك تجريبي', 'owner') returning id`,
    );
  }
  (await cookies()).set(DEV_COOKIE, row.id, { httpOnly: true, sameSite: "lax", path: "/admin" });
}

export async function signOut() {
  if (authMode() === "supabase") await (await supabaseServerClient()).auth.signOut();
  (await cookies()).delete({ name: DEV_COOKIE, path: "/admin" });
}

export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
