import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with the service role key. SERVER ONLY — this key bypasses every
 * security rule, so it must never reach the browser (the "server-only" import above
 * makes the build fail if a client component ever imports this file).
 */
function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Makes sure an allowlisted admin has a Supabase login account. Public sign-up stays
 * disabled in Supabase, so only emails we create here can ever receive a login link.
 */
export async function ensureAuthUser(email: string) {
  const { error } = await adminClient().auth.admin.createUser({ email, email_confirm: true });
  if (error && error.code !== "email_exists" && !/already/i.test(error.message)) throw error;
}
