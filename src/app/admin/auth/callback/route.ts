import { NextResponse } from "next/server";
import { authMode, supabaseServerClient } from "@/lib/admin/session";

/** The email login link lands here. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (authMode() === "supabase" && code) {
    const supabase = await supabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/admin", url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?failed=1", url.origin));
}
