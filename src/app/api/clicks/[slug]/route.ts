import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { recordWhatsAppClick } from "@/lib/data/doctors";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Counts one WhatsApp-button click for a profile (count + date only).
 * The same visitor is counted at most a few times per profile per hour, so the
 * numbers can't be inflated by repeated clicking.
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/clicks/[slug]">) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response(null, { status: 404 });
  const db = await getDb();
  if (!(await rateLimit(db, `click:${slug}`, clientIp(req.headers), LIMITS.click))) {
    return new Response(null, { status: 204 }); // quietly not counted
  }
  const counted = await recordWhatsAppClick(db, slug);
  return new Response(null, { status: counted ? 204 : 404 });
}
