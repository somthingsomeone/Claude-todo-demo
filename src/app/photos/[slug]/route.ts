import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { getPublicPhoto } from "@/lib/data/doctors";

/** Serves a doctor's photo (only stored with their permission, only for public profiles). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/photos/[slug]">) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response("Not found", { status: 404 });
  const photo = await getPublicPhoto(await getDb(), slug);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      // The URL changes (?v=) whenever the photo changes.
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
