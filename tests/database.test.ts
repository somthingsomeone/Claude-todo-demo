import { describe, expect, it } from "vitest";
import { getPublicDoctor, getPublicPhoto, listPublicDoctors, recordWhatsAppClick } from "@/lib/data/doctors";
import { FormError, submitCorrection } from "@/lib/data/corrections";
import { AdminError, containsIdLikeNumber } from "@/lib/admin/core";
import {
  createDoctor, deleteAllDemo, getAdminDoctor, listAdminDoctors, normalizeSaudiMobile, savePhoto, setHidden, updateDoctor,
} from "@/lib/admin/profiles";
import { eraseRequest, listRequests, purgeExpired, setRequestStatus } from "@/lib/admin/requests";
import { addAdmin, mayRequestLogin, resolveAdminByEmail, setAdminActive } from "@/lib/admin/admins";
import { dashboardStats, testVerdict } from "@/lib/admin/stats";
import { freshDb, makeOwner, realDoctor } from "./helpers";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("public profiles", () => {
  it("shows the demo profiles from the seed", async () => {
    const db = await freshDb();
    const list = await listPublicDoctors(db);
    expect(list.length).toBe(12);
    expect(list.every((d) => d.demo)).toBe(true);
    const sara = await getPublicDoctor(db, "demo-sara-alqahtani");
    // Ratings exist in the database but are never read for public pages.
    expect(sara && "rating" in sara).toBe(false);
    expect(sara?.photo).toBeNull();
  });

  it("new real profiles start as drafts; published + not hidden is public", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    const id = await createDoctor(db, owner, realDoctor());
    expect((await getAdminDoctor(db, id))?.status).toBe("draft");
    expect(await getPublicDoctor(db, "test-doctor")).toBeNull();
    await updateDoctor(db, owner, id, realDoctor({ status: "published" }));
    const shown = await getPublicDoctor(db, "test-doctor");
    expect(shown?.whatsapp).toBe("966551234567");
    expect(shown?.treats).toEqual(["جفاف العين", "المياه البيضاء"]);
    expect(shown?.languages).toEqual(["العربية", "الإنجليزية"]);
    await setHidden(db, owner, id, true);
    expect(await getPublicDoctor(db, "test-doctor")).toBeNull();
  });

  it("keeps no nationality data", async () => {
    const db = await freshDb();
    const cols = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name = 'doctors' and column_name like 'nationality%'`,
    );
    expect(cols).toEqual([]);
  });

  it("ignores ratings typed by admins (a profile never rates itself)", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    await createDoctor(db, owner, realDoctor({ status: "published", rating: "5", rating_count: "999", rating_source: "أنا" }));
    const [row] = await db.query<{ rating: unknown; rating_count: unknown }>(`select rating, rating_count from doctors where slug = 'test-doctor'`);
    expect([row.rating, row.rating_count]).toEqual([null, null]);
  });

  it("enforces the title, honorific and ID-number rules", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    await expect(createDoctor(db, owner, realDoctor({ name: "د. أحمد" }))).rejects.toThrow(/بدون لقب/);
    await expect(createDoctor(db, owner, realDoctor({ specialty: "physio" }))).rejects.toThrow(/المستند/);
    await expect(createDoctor(db, owner, realDoctor({ title: "أخصائي علاج طبيعي" }))).rejects.toThrow(/للعلاج الطبيعي فقط/);
    await expect(createDoctor(db, owner, realDoctor({ title_note: "رقم 1023456789", specialty: "physio" }))).rejects.toThrow(/أرقامًا/);
    await expect(createDoctor(db, owner, realDoctor({ slug: "demo-x" }))).rejects.toThrow(AdminError);
    // A physiotherapist titled "د." is allowed only with a documented title.
    await createDoctor(db, owner, realDoctor({ slug: "physio-dr", specialty: "physio", title_note: "شهادة دكتوراه مرفقة من العيادة" }));
    expect(containsIdLikeNumber("١٠٢٣٤٥٦٧٨٩")).toBe(true);
  });

  it("normalizes Saudi mobile numbers", () => {
    expect(normalizeSaudiMobile("0551234567")).toBe("966551234567");
    expect(normalizeSaudiMobile("+966 55 123 4567")).toBe("966551234567");
    expect(normalizeSaudiMobile("٠٥٥١٢٣٤٥٦٧")).toBe("966551234567");
    expect(normalizeSaudiMobile("")).toBe("");
    expect(() => normalizeSaudiMobile("0112345678")).toThrow(AdminError);
  });
});

describe("whatsapp click counter", () => {
  it("counts clicks per profile per day, only for public profiles with a number", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    const id = await createDoctor(db, owner, realDoctor());
    expect(await recordWhatsAppClick(db, "test-doctor")).toBe(false); // still a draft
    await updateDoctor(db, owner, id, realDoctor({ status: "published" }));
    for (let i = 0; i < 3; i++) expect(await recordWhatsAppClick(db, "test-doctor")).toBe(true);
    expect(await recordWhatsAppClick(db, "demo-sara-alqahtani")).toBe(false); // no number
    const row = (await listAdminDoctors(db)).find((d) => d.id === id)!;
    expect(row.clicks_total).toBe(3);
    const stats = await dashboardStats(db);
    expect(stats.clicks_30d).toBe(3);
    expect(stats.daily).toHaveLength(14);
    const cols = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name = 'whatsapp_clicks'`,
    );
    expect(cols.map((c) => c.column_name).sort()).toEqual(["clicks", "day", "doctor_id"]);
  });

  it("applies the 90-day test rule", () => {
    expect(testVerdict(301).tone).toBe("good");
    expect(testVerdict(300).tone).toBe("mid");
    expect(testVerdict(99).tone).toBe("low");
  });
});

describe("photos", () => {
  it("requires permission and a real image file", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    const id = await createDoctor(db, owner, realDoctor({ status: "published" }));
    const file = { bytes: PNG, size: PNG.length };
    await expect(savePhoto(db, owner, id, file, { permission_note: "x" })).rejects.toThrow(/إذن/);
    await expect(
      savePhoto(db, owner, id, { bytes: new TextEncoder().encode("<svg>"), size: 5 }, { permission: "on", permission_note: "واتساب" }),
    ).rejects.toThrow(/الصيغ/);
    await savePhoto(db, owner, id, file, { permission: "on", permission_note: "وافق كتابيًا عبر واتساب" });
    expect((await getAdminDoctor(db, id))?.has_photo).toBe(true);
    expect((await getPublicDoctor(db, "test-doctor"))?.photo).toMatch(/^\/photos\/test-doctor\?v=/);
    const photo = await getPublicPhoto(db, "test-doctor");
    expect(photo?.mime).toBe("image/png");
    expect(Array.from(photo!.data)).toEqual(Array.from(PNG));
    const [log] = await db.query<{ after_data: { permission_note: string; data?: unknown } }>(
      `select after_data from audit_log where action = 'upload_photo'`,
    );
    expect(log.after_data.permission_note).toBe("وافق كتابيًا عبر واتساب");
  });
});

describe("correction requests", () => {
  const form = {
    name: "سائل",
    email: "Person@Example.com",
    relationship: "self",
    profile: "demo-sara-alqahtani",
    message: "أرجو تحديث اسم العيادة",
    consent: "on",
  };

  it("stores only the allowed fields and can erase them", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    await expect(submitCorrection(db, { ...form, consent: undefined })).rejects.toThrow(FormError);
    await expect(submitCorrection(db, { ...form, email: "bad" })).rejects.toThrow(FormError);
    await submitCorrection(db, form);
    await submitCorrection(db, { ...form, website: "spam" }); // honeypot: silently ignored
    const [req] = await listRequests(db);
    expect((await listRequests(db)).length).toBe(1);
    expect(req.requester_email).toBe("person@example.com");
    expect(req.profile_label).toBe("سارة القحطاني");
    await expect(eraseRequest(db, owner, req.id)).rejects.toThrow(/أغلق/);
    await setRequestStatus(db, owner, req.id, "closed");
    await eraseRequest(db, owner, req.id);
    const [after] = await listRequests(db);
    expect([after.requester_name, after.requester_email, after.message]).toEqual([null, null, null]);
    const logs = await db.query<{ t: string }>(`select coalesce(before_data::text, '') || coalesce(after_data::text, '') as t from audit_log`);
    expect(logs.some((l) => l.t.includes("person@example.com"))).toBe(false);
  });

  it("purges closed requests after the retention period", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    await submitCorrection(db, form);
    const [req] = await listRequests(db);
    await setRequestStatus(db, owner, req.id, "closed");
    await db.query(`update correction_requests set closed_at = now() - interval '40 days'`);
    expect(await purgeExpired(db, null)).toBe(0);
    expect(await purgeExpired(db, 30)).toBe(1);
  });
});

describe("admins", () => {
  it("makes ADMIN_OWNER_EMAIL the first owner, then only listed admins can sign in", async () => {
    const db = await freshDb();
    expect(await mayRequestLogin(db, "someone@x.com", "boss@x.com")).toBe(false);
    expect(await mayRequestLogin(db, "boss@x.com", "boss@x.com")).toBe(true);
    const owner = (await resolveAdminByEmail(db, "Boss@x.com", null, "boss@x.com"))!;
    expect(owner.role).toBe("owner");
    expect(await resolveAdminByEmail(db, "other@x.com", null, "other@x.com")).toBeNull();
    await addAdmin(db, owner, { email: "helper@x.com", display_name: "مساعد", role: "editor" });
    const helper = (await resolveAdminByEmail(db, "helper@x.com", null, null))!;
    expect(helper.role).toBe("editor");
    await expect(addAdmin(db, helper, { email: "a@x.com", display_name: "a", role: "editor" })).rejects.toThrow(/للمالك/);
    await expect(setAdminActive(db, owner, owner.id, false)).rejects.toThrow(AdminError);
    await setAdminActive(db, owner, helper.id, false);
    expect(await resolveAdminByEmail(db, "helper@x.com", null, null)).toBeNull();
  });

  it("can remove all demo profiles at launch", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    expect(await deleteAllDemo(db, owner)).toBe(12);
    expect(await listPublicDoctors(db)).toEqual([]);
  });
});
