import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicDoctor, listPublicDoctors, publicWhere } from "@/lib/data/doctors";
import { createDoctor, getAdminDoctor, setHidden, updateDoctor } from "@/lib/admin/profiles";
import { AdminError } from "@/lib/admin/core";
import { resolveAuthMode } from "@/lib/admin/auth-mode";
import { hashKey, rateLimit } from "@/lib/rate-limit";
import { doctorJsonLd, faqJsonLd, serializeJsonLd } from "@/lib/seo";
import { isSiteLive, siteUrl } from "@/lib/site";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";
import robots from "@/app/robots";
import { freshDb, makeOwner, realDoctor } from "./helpers";

afterEach(() => vi.unstubAllEnvs());

describe("launch switch", () => {
  it("is off unless SITE_LIVE is exactly true", () => {
    expect(isSiteLive({})).toBe(false);
    expect(isSiteLive({ SITE_LIVE: "false" })).toBe(false);
    expect(isSiteLive({ SITE_LIVE: "1" })).toBe(false);
    expect(isSiteLive({ SITE_LIVE: "true" })).toBe(true);
    expect(isSiteLive({ SITE_LIVE: " TRUE " })).toBe(true);
  });

  it("reads the site URL from NEXT_PUBLIC_SITE_URL", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://panax.sa/" })).toBe("https://panax.sa");
    expect(siteUrl({})).toBe("http://localhost:3000");
  });

  it("hides demo profiles when live", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    await createDoctor(db, owner, realDoctor({ status: "published" }));
    expect(publicWhere(true)).toContain("not d.is_demo");
    vi.stubEnv("SITE_LIVE", "false");
    expect((await listPublicDoctors(db)).length).toBe(13);
    vi.stubEnv("SITE_LIVE", "true");
    const live = await listPublicDoctors(db);
    expect(live.map((d) => d.slug)).toEqual(["test-doctor"]);
    expect(await getPublicDoctor(db, "demo-sara-alqahtani")).toBeNull();
  });

  it("robots.txt blocks everything before launch and allows the named crawlers after", () => {
    vi.stubEnv("SITE_LIVE", "false");
    expect(robots().rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    vi.stubEnv("SITE_LIVE", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://panax.sa");
    const live = robots();
    const agents = (Array.isArray(live.rules) ? live.rules : [live.rules]).map((r) => r.userAgent);
    for (const bot of ["Googlebot", "Bingbot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"]) expect(agents).toContain(bot);
    expect(live.sitemap).toBe("https://panax.sa/sitemap.xml");
  });
});

describe("status and consent", () => {
  it("cannot publish without a consent date (form and database)", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    await expect(
      createDoctor(db, owner, realDoctor({ status: "published", consent_date: "", consent_method: "" })),
    ).rejects.toThrow(/موافقة/);
    const id = await createDoctor(db, owner, realDoctor({ consent_date: "", consent_method: "" }));
    await expect(db.query(`update doctors set status = 'published' where id = $1`, [id])).rejects.toThrow(/published_needs_consent/);
    await expect(createDoctor(db, owner, realDoctor({ slug: "x2", consent_method: "" }))).rejects.toThrow(AdminError);
    await expect(createDoctor(db, owner, realDoctor({ slug: "x3", consent_date: "2999-01-01" }))).rejects.toThrow(/المستقبل/);
  });

  it("hide works on top of published, and every change is in the audit log", async () => {
    const db = await freshDb();
    const owner = await makeOwner(db);
    const id = await createDoctor(db, owner, realDoctor({ status: "published" }));
    expect(await getPublicDoctor(db, "test-doctor")).not.toBeNull();
    await setHidden(db, owner, id, true);
    expect(await getPublicDoctor(db, "test-doctor")).toBeNull();
    expect((await getAdminDoctor(db, id))?.consent_method).toBe("whatsapp");
    await updateDoctor(db, owner, id, realDoctor({ status: "draft" }));
    const actions = (await db.query<{ action: string }>(`select action from audit_log where entity_id = $1 order by id`, [id])).map(
      (r) => r.action,
    );
    expect(actions).toEqual(["create", "hide", "update"]);
  });

  it("has a table ready for doctors claiming their profile later, protected by RLS", async () => {
    const db = await freshDb();
    const rows = await db.query<{ tablename: string; rowsecurity: boolean }>(
      `select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename <> '_migrations'`,
    );
    expect(rows.map((r) => r.tablename)).toContain("profile_claims");
    expect(rows.every((r) => r.rowsecurity)).toBe(true);
  });
});

describe("admin login mode", () => {
  it("uses Supabase only with the server-only service role key, never dev mode in real environments", () => {
    const sb = { NEXT_PUBLIC_SUPABASE_URL: "u", NEXT_PUBLIC_SUPABASE_ANON_KEY: "a" };
    expect(resolveAuthMode({ ...sb, SUPABASE_SERVICE_ROLE_KEY: "s" })).toBe("supabase");
    expect(resolveAuthMode(sb)).toBe("disabled");
    expect(resolveAuthMode({ ADMIN_DEV_LOGIN: "1" })).toBe("dev");
    expect(resolveAuthMode({ ADMIN_DEV_LOGIN: "1", VERCEL: "1" })).toBe("disabled");
  });
});

describe("rate limiting", () => {
  it("allows up to the limit per window and stores only a hash of the IP", async () => {
    const db = await freshDb({ demo: false });
    const opts = { limit: 3, windowSec: 3600 };
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await rateLimit(db, "test", "203.0.113.9", opts));
    expect(results).toEqual([true, true, true, false, false]);
    expect(await rateLimit(db, "test", "198.51.100.1", opts)).toBe(true);
    const keys = (await db.query<{ key: string }>(`select key from rate_limits`)).map((r) => r.key);
    expect(keys.some((k) => k.includes("203.0.113.9"))).toBe(false);
    expect(hashKey("203.0.113.9", "s")).toBe(hashKey("203.0.113.9", "s"));
  });
});

describe("structured data", () => {
  it("never includes ratings and can't break out of the script tag", async () => {
    const db = await freshDb();
    const doctors = await listPublicDoctors(db);
    for (const d of doctors) {
      const json = JSON.stringify(doctorJsonLd(d));
      expect(json).not.toMatch(/rating|review/i);
    }
    const physio = doctors.find((d) => d.specialty === "physio")!;
    expect(doctorJsonLd(physio)["@type"]).toBe("MedicalBusiness");
    expect(doctorJsonLd(doctors.find((d) => d.specialty === "eyes")!)["@type"]).toBe("Physician");
    expect(serializeJsonLd({ x: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });

  it("every specialty page has an intro and 5 FAQs", () => {
    expect(SPECIALTY_ORDER).toHaveLength(5);
    for (const s of SPECIALTY_ORDER) {
      expect(SPECIALTY_PAGES[s].intro.length).toBeGreaterThan(50);
      expect(SPECIALTY_PAGES[s].faqs).toHaveLength(5);
      expect(faqJsonLd(SPECIALTY_PAGES[s].faqs).mainEntity).toHaveLength(5);
    }
  });
});
