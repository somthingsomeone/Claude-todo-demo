import { createDb, type Db } from "@/lib/db/client";
import { migrate, seedDemoIfEmpty } from "@/lib/db/migrate";
import type { Actor } from "@/lib/admin/core";

export async function freshDb({ demo = true } = {}): Promise<Db> {
  const db = await createDb({ dataDir: "memory://" });
  await migrate(db);
  if (demo) await seedDemoIfEmpty(db);
  return db;
}

export async function makeOwner(db: Db): Promise<Actor> {
  const [row] = await db.query<{ id: string }>(
    `insert into admin_users (email, display_name, role) values ('owner@example.com', 'المالك', 'owner') returning id`,
  );
  return { id: row.id, email: "owner@example.com", displayName: "المالك", role: "owner" };
}

export const realDoctor = (over: Record<string, string> = {}) => ({
  slug: "test-doctor",
  name: "اسم تجريبي للاختبار",
  title: "د.",
  specialty: "eyes",
  role: "استشاري عيون",
  hospital: "مستشفى للاختبار",
  district: "حي للاختبار، الرياض",
  bio: "نبذة",
  treats: "جفاف العين\nالمياه البيضاء",
  languages: "العربية، الإنجليزية",
  years_experience: "10",
  whatsapp: "0551234567",
  nationality_status: "verified",
  nationality_note: "تأكيد من العيادة بالبريد",
  source: "موقع العيادة الرسمي",
  checked_at: "2026-10-01",
  ...over,
});
