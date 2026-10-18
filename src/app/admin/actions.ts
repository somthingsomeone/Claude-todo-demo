"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { AdminError } from "@/lib/admin/core";
import * as A from "@/lib/admin/admins";
import * as P from "@/lib/admin/profiles";
import * as R from "@/lib/admin/requests";
import { authMode, devSignIn, requireAdmin, signOut, siteOrigin, supabaseServerClient } from "@/lib/admin/session";

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
  // The same message is shown whether or not the email is an admin.
  if (await A.mayRequestLogin(db, email, process.env.ADMIN_OWNER_EMAIL ?? null)) {
    const supabase = await supabaseServerClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${await siteOrigin()}/admin/auth/callback`, shouldCreateUser: true },
    });
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
export async function createDoctor(fd: FormData) {
  const actor = await requireAdmin();
  await run(
    fd,
    async () => `/admin/doctors/${await P.createDoctor(await getDb(), actor, values(fd))}`,
    "تمت الإضافة. الملف مخفي حتى تضغط «إظهار للزوار».",
  );
}
export async function updateDoctor(fd: FormData) {
  const actor = await requireAdmin();
  await run(fd, async () => {
    await P.updateDoctor(await getDb(), actor, String(fd.get("id")), values(fd));
  });
}
export async function setHidden(fd: FormData) {
  const actor = await requireAdmin();
  const hidden = fd.get("hidden") === "1";
  await run(
    fd,
    async () => {
      await P.setHidden(await getDb(), actor, String(fd.get("id")), hidden);
    },
    hidden ? "تم إخفاء الملف." : "الملف ظاهر للزوار الآن.",
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
