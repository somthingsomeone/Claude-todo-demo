import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveAuthMode } from "@/lib/admin/auth-mode";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth/callback"];

/**
 * First line of protection for /admin: no login → straight to the login page.
 * Every admin page and action ALSO checks the signed-in admin on the server
 * (requireAdmin), and the database has Row Level Security on every table.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const response = NextResponse.next({ request });
  const toLogin = () => NextResponse.redirect(new URL("/admin/login", request.url));
  const mode = resolveAuthMode(process.env);

  if (mode === "supabase") {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    });
    const { data } = await supabase.auth.getUser(); // also refreshes the session cookie
    if (!data.user && !isPublic) return toLogin();
    return response;
  }
  if (mode === "dev") {
    if (!request.cookies.get("dev_admin_id") && !isPublic) return toLogin();
    return response;
  }
  // Admin not configured: only the login page (which says so) is reachable.
  return isPublic ? response : toLogin();
}

export const config = { matcher: ["/admin/:path*"] };
