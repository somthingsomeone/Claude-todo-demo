import type { Db } from "../db/client";

/** 90-day test rule from the plan: >300 clicks/month → phase 2; 100–300 → improve marketing; <100 → rethink. */
export function testVerdict(clicksPerMonth: number) {
  if (clicksPerMonth > 300) return { tone: "good", text: "ممتاز — فوق 300 ضغطة: جاهزين للمرحلة الثانية." } as const;
  if (clicksPerMonth >= 100) return { tone: "mid", text: "بين 100 و300 — نحسّن التسويق." } as const;
  return { tone: "low", text: "أقل من 100 — نراجع الفكرة أو طريقة الوصول للناس." } as const;
}

export async function dashboardStats(db: Db) {
  const [row] = await db.query<{
    clicks_month: number;
    clicks_30d: number;
    clicks_total: number;
    doctors_public: number;
    doctors_hidden: number;
    doctors_demo: number;
    requests_open: number;
  }>(
    `with today as (select (now() at time zone 'Asia/Riyadh')::date as d)
     select
       (select coalesce(sum(clicks), 0)::int from whatsapp_clicks, today where day >= date_trunc('month', today.d)::date) as clicks_month,
       (select coalesce(sum(clicks), 0)::int from whatsapp_clicks, today where day > today.d - 30) as clicks_30d,
       (select coalesce(sum(clicks), 0)::int from whatsapp_clicks) as clicks_total,
       (select count(*)::int from doctors where not is_hidden and not is_demo) as doctors_public,
       (select count(*)::int from doctors where is_hidden and not is_demo) as doctors_hidden,
       (select count(*)::int from doctors where is_demo) as doctors_demo,
       (select count(*)::int from correction_requests where status = 'open') as requests_open`,
  );
  const daily = await db.query<{ day: string; clicks: number }>(
    `with today as (select (now() at time zone 'Asia/Riyadh')::date as d)
     select to_char(g.day, 'MM-DD') as day, coalesce(sum(c.clicks), 0)::int as clicks
     from today, generate_series(today.d - 13, today.d, interval '1 day') as g(day)
     left join whatsapp_clicks c on c.day = g.day::date
     group by g.day order by g.day`,
  );
  return { ...row, daily };
}
