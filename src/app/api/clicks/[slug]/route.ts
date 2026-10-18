import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { recordWhatsAppClick } from "@/lib/data/doctors";

/** Counts one WhatsApp-button click for a profile. Nothing about the visitor is stored. */
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/clicks/[slug]">) {
  const { slug } = await ctx.params;
  const counted = await recordWhatsAppClick(await getDb(), slug);
  return new Response(null, { status: counted ? 204 : 404 });
}
