export type AuthMode = "supabase" | "dev" | "disabled";

/**
 * - "supabase": real logins by email link (production). Needs the Supabase URL, the public
 *   anon key AND the server-only service role key (used to create allowlisted admins, so
 *   public sign-up can stay switched off in Supabase).
 * - "dev": a no-password login for building on a local computer ONLY.
 *   It can never turn on when a real database, Supabase or Vercel is configured.
 * - "disabled": admin area unavailable.
 */
export function resolveAuthMode(env: Record<string, string | undefined>): AuthMode {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  const realEnvironment = !!(env.DATABASE_URL || env.VERCEL || env.VERCEL_ENV || env.NEXT_PUBLIC_SUPABASE_URL);
  if (env.ADMIN_DEV_LOGIN === "1" && !realEnvironment) return "dev";
  return "disabled";
}
