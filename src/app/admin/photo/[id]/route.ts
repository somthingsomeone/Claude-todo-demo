import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { getCurrentAdmin } from "@/lib/admin/session";

/** Photo preview for admins (works even while the profile is hidden). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/admin/photo/[id]">) {
  if (!(await getCurrentAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [photo] = await (await getDb()).query<{ mime: string; data: Uint8Array }>(
    `select mime, data from doctor_photos where doctor_id = $1`,
    [id],
  );
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
