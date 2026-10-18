"use client";

import Link from "next/link";
import type { Doctor } from "@/lib/doctors";
import { useFavorites } from "@/lib/favorites";
import { DoctorCard } from "./DoctorCard";
import { HeartIcon } from "./Icons";

export function FavoritesView({ doctors }: { doctors: Doctor[] }) {
  const { ids } = useFavorites();
  // Keep the order the visitor saved them in (newest first).
  const saved = ids.map((id) => doctors.find((d) => d.slug === id)).filter((d) => d !== undefined);

  return (
    <section className="page" aria-labelledby="fav-title">
      <div className="page-head">
        <h1 id="fav-title">المفضلة</h1>
        <p className="muted">الأطباء اللي حفظتهم يوصلون لهم بسرعة من هنا.</p>
      </div>

      {saved.length > 0 ? (
        <div className="card-grid">
          {saved.map((d) => (
            <DoctorCard key={d.slug} doctor={d} />
          ))}
        </div>
      ) : (
        <div className="empty glass">
          <span className="empty__icon">
            <HeartIcon size={28} />
          </span>
          <p className="empty__title">ما حفظت أحد للحين</p>
          <p>اضغط على القلب في بطاقة أي طبيب عشان يظهر هنا.</p>
          <Link href="/" className="btn-primary">
            تصفّح الأطباء
          </Link>
        </div>
      )}

      <p className="note">
        المفضلة محفوظة حاليًا على جهازك فقط. بعد تفعيل الحسابات تقدر تسجّل دخولك وتلقاها على كل أجهزتك.
      </p>
    </section>
  );
}
