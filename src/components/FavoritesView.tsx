"use client";

import Link from "next/link";
import type { Doctor } from "@/lib/doctors";
import { useFavorites } from "@/lib/favorites";
import { DoctorSlip } from "./DoctorSlip";
import { HeartIcon } from "./Icons";

export function FavoritesView({ doctors }: { doctors: Doctor[] }) {
  const { ids } = useFavorites();
  // Keep the order the visitor saved them in (newest first).
  const saved = ids.map((id) => doctors.find((d) => d.slug === id)).filter((d) => d !== undefined);

  return (
    <section className="wrap page" aria-labelledby="fav-title">
      <div>
        <h1 id="fav-title" className="page__title">
          المحفوظات
        </h1>
        <p className="page__lede">الأطباء الذين حفظتهم، محفوظون على هذا الجهاز فقط.</p>
      </div>
      {saved.length > 0 ? (
        <div className="stack">
          {saved.map((d) => (
            <DoctorSlip key={d.slug} doctor={d} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <HeartIcon size={28} className="icon muted" />
          <p className="empty__title">لم تحفظ أي طبيب بعد</p>
          <p className="muted">اضغط رمز القلب في بطاقة أي طبيب ليظهر هنا.</p>
          <Link href="/" className="btn">
            تصفّح الأطباء
          </Link>
        </div>
      )}
    </section>
  );
}
