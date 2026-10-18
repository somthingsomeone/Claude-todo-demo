import type { Db } from "../db/client";
import { AdminError, assertOwner, audit, oneOf, text, type Actor, type AdminRole } from "./core";

interface AdminRow {
  id: string;
  email: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  auth_user_id: string | null;
}

const toActor = (r: Pick<AdminRow, "id" | "email" | "display_name" | "role">): Actor => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name,
  role: r.role,
});

/**
 * Finds the active admin for a signed-in email. When there are no admins at all,
 * the email in ADMIN_OWNER_EMAIL becomes the first owner.
 */
export async function resolveAdminByEmail(
  db: Db,
  email: string,
  authUserId: string | null,
  ownerEmail: string | null,
): Promise<Actor | null> {
  const [row] = await db.query<AdminRow>(
    `select id, email, display_name, role, is_active, auth_user_id from admin_users where email = lower($1)`,
    [email],
  );
  if (row) {
    if (!row.is_active) return null;
    if (authUserId) {
      if (row.auth_user_id && row.auth_user_id !== authUserId) return null;
      if (!row.auth_user_id) await db.query(`update admin_users set auth_user_id = $2 where id = $1`, [row.id, authUserId]);
    }
    return toActor(row);
  }
  const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from admin_users`);
  if (n === 0 && ownerEmail && ownerEmail.toLowerCase() === email.toLowerCase()) {
    const [created] = await db.query<AdminRow>(
      `insert into admin_users (email, display_name, role, auth_user_id) values (lower($1), 'المالك', 'owner', $2)
       returning id, email, display_name, role`,
      [email, authUserId],
    );
    await audit(db, toActor(created), "bootstrap_owner", "admin_users", created.id, null, { role: "owner" });
    return toActor(created);
  }
  return null;
}

/** Whether to send a login link (same message is shown to the visitor either way). */
export async function mayRequestLogin(db: Db, email: string, ownerEmail: string | null): Promise<boolean> {
  const [row] = await db.query<{ is_active: boolean }>(`select is_active from admin_users where email = lower($1)`, [email]);
  if (row) return row.is_active;
  const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from admin_users`);
  return n === 0 && !!ownerEmail && ownerEmail.toLowerCase() === email.toLowerCase();
}

export async function listAdmins(db: Db) {
  return db.query<AdminRow>(`select id, email, display_name, role, is_active, auth_user_id from admin_users order by created_at`);
}

export async function addAdmin(db: Db, actor: Actor, values: Record<string, unknown>) {
  assertOwner(actor);
  const email = text(values, "email", { required: true, max: 200, label: "البريد" })!.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AdminError("بريد إلكتروني غير صحيح.");
  const name = text(values, "display_name", { required: true, max: 80, label: "الاسم" })!;
  const role = oneOf(values, "role", ["owner", "editor"] as const, { required: true, label: "الدور" })!;
  const [exists] = await db.query(`select 1 from admin_users where email = $1`, [email]);
  if (exists) throw new AdminError("هذا البريد مضاف مسبقًا.");
  const [row] = await db.query<{ id: string }>(
    `insert into admin_users (email, display_name, role) values ($1, $2, $3) returning id`,
    [email, name, role],
  );
  await audit(db, actor, "create", "admin_users", row.id, null, { email, role });
}

export async function setAdminActive(db: Db, actor: Actor, id: string, active: boolean) {
  assertOwner(actor);
  if (id === actor.id && !active) throw new AdminError("لا يمكنك إيقاف حسابك بنفسك.");
  const [target] = await db.query<{ role: AdminRole }>(`select role from admin_users where id = $1`, [id]);
  if (!target) throw new AdminError("الحساب غير موجود.");
  if (!active && target.role === "owner") {
    const [{ n }] = await db.query<{ n: number }>(
      `select count(*)::int as n from admin_users where role = 'owner' and is_active and id <> $1`,
      [id],
    );
    if (n === 0) throw new AdminError("يجب أن يبقى مالك واحد نشط على الأقل.");
  }
  await db.query(`update admin_users set is_active = $2 where id = $1`, [id, active]);
  await audit(db, actor, active ? "activate" : "deactivate", "admin_users", id, null, { is_active: active });
}
