"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { AdminError } from "@/lib/admin/core";
import * as A from "@/lib/admin/admins";
import * as P from "@/lib/admin/profiles";
import * as R from "@/lib/admin/requests";
import { authMode, devSignIn, requireAdmin, signOut, siteOrigin, supabaseServerClient } from "@/lib/admin/session";
import { ensureAuthUser } from "@/lib/admin/supabase-admin";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";

const values = (fd: FormData) => Object.fromEntries(fd.entries());
const back = (fd: FormData) => {
  const b = String(fd.get("_back") ?? "/admin");
  return b.startsWith("/admin") ? b.split("#")[0].split("?")[0] : "/admin";
};
const withMsg = (path: string, key: "msg" | "err", text: string) =>
  `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;

/** Runs an admin change, then returns to the page with a success or error message. */
async function run(fd: FormData, work: () => Promise<string | void>, success = "تم الحفظ.") {
  let target = back(fd);
  try {
    const next = await work();
    target = withMsg(next ?? target, "msg", success);
  } catch (e) {
    if (e instanceof AdminError) target = withMsg(target, "err", e.message);
    else {
      console.error(e);
      target = withMsg(target, "err", "حدث خطأ غير متوقع. لم يُحفظ التغيير.");
    }
  }
  redirect(target);
}

// ---- login -----------------------------------------------------------------
export async function requestLoginLink(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const done = "/admin/login?sent=1";
  if (authMode() !== "supabase" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(done);
  const db = await getDb();
  if (!(await rateLimit(db, "login", clientIp(await headers()), LIMITS.login))) redirect(done);
  // Only allowlisted emails get a link; the same message is shown either way.
  if (await A.mayRequestLogin(db, email, process.env.ADMIN_OWNER_EMAIL ?? null)) {
    try {
      await ensureAuthUser(email);
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || (await siteOrigin());
      const supabase = await supabaseServerClient();
      // shouldCreateUser: false — nobody can sign themselves up.
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/admin/auth/callback`, shouldCreateUser: false },
      });
    } catch (e) {
      console.error("login link failed", e);
    }
  }
  redirect(done);
}
export async function devLogin() {
  await devSignIn();
  redirect("/admin");
}
export async function logout() {
  await signOut();
  redirect("/admin/login");
}

// ---- doctors ---------------------------------------------------------------
export type DoctorFormState = { n: number; error?: string; values?: Record<string, string> };

/** Add or edit a doctor. On error the form keeps what was typed (see DoctorForm). */
async function saveDoctor(prev: DoctorFormState, fd: FormData, isNew: boolean): Promise<DoctorFormState> {
  const actor = await requireAdmin();
  let id = String(fd.get("id") ?? "");
  try {
    const db = await getDb();
    if (isNew) id = await P.createDoctor(db, actor, values(fd));
    else await P.updateDoctor(db, actor, id, values(fd));
  } catch (e) {
    const error = e instanceof AdminError ? e.message : "حدث خطأ غير متوقع. لم يُحفظ التغيير.";
    if (!(e instanceof AdminError)) console.error(e);
    const typed = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
    return { n: prev.n + 1, error, values: typed };
  }
  redirect(withMsg(`/admin/doctors/${id}`, "msg", isNew ? "تمت الإضافة." : "تم الحفظ."));
}
export async function createDoctorForm(prev: DoctorFormState, fd: FormData) {
  return saveDoctor(prev, fd, true);
}
export async function updateDoctorForm(prev: DoctorFormState, fd: FormData) {
  return saveDoctor(prev, fd, false);
}
export async function setHidden(fd: FormData) {
  const actor = await requireAdmin();
  const hidden = fd.get("hidden") === "1";
  await run(
    fd,
    async () => {
      await P.setHidden(await getDb(), actor, String(fd.get("id")), hidden);
    },
    hidden ? "تم إخفاء الملف مؤقتًا." : "تم إلغاء الإخفاء.",
  );
}
export async function deleteDoctor(fd: FormData) {
  const actor = await requireAdmin();
  await run(
    fd,
    async () => {
      await P.deleteDoctor(await getDb(), actor, String(fd.get("id")), String(fd.get("confirm_name") ?? ""));
      return "/admin/doctors";
    },
    "تم حذف الملف نهائيًا.",
  );
}
export async function deleteAllDemo(fd: FormData) {
  const actor = await requireAdmin({ owner: true });
  await run(
    fd,
    async () => {
      if (fd.get("confirm") !== "احذف") throw new AdminError("للتأكيد اكتب كلمة: احذف");
      await P.deleteAllDemo(await getDb(), actor);
    },
    "تم حذف كل الملفات التجريبية.",
  );
}
export async function uploadPhoto(fd: FormData) {
  const actor = await requireAdmin();
  await run(
    fd,
    async () => {
      const file = fd.get("photo");
      if (!(file instanceof File)) throw new AdminError("اختر صورة.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      await P.savePhoto(await getDb(), actor, String(fd.get("id")), { bytes, size: file.size }, values(fd));
    },
    "تم رفع الصورة.",
  );
}
export async function removePhoto(fd: FormData) {
  const actor = await requireAdmin();
  await run(
    fd,
    async () => {
      await P.removePhoto(await getDb(), actor, String(fd.get("id")));
    },
    "تم حذف الصورة.",
  );
}

// ---- correction requests -----------------------------------------------------
export async function setRequestStatus(fd: FormData) {
  const actor = await requireAdmin();
  const status = fd.get("status") === "closed" ? "closed" : "open";
  await run(fd, async () => {
    await R.setRequestStatus(await getDb(), actor, String(fd.get("id")), status);
  });
}
export async function eraseRequest(fd: FormData) {
  const actor = await requireAdmin();
  await run(
    fd,
    async () => {
      await R.eraseRequest(await getDb(), actor, String(fd.get("id")));
    },
    "تم مسح البيانات الشخصية للطلب.",
  );
}

// ---- admins -------------------------------------------------------------------
export async function addAdmin(fd: FormData) {
  const actor = await requireAdmin({ owner: true });
  await run(
    fd,
    async () => {
      await A.addAdmin(await getDb(), actor, values(fd));
    },
    "تمت إضافة المشرف. يقدر يدخل برابط على بريده.",
  );
}
export async function setAdminActive(fd: FormData) {
  const actor = await requireAdmin({ owner: true });
  await run(fd, async () => {
    await A.setAdminActive(await getDb(), actor, String(fd.get("id")), fd.get("active") === "1");
  });
}
