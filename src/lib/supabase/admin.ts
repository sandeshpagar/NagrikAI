import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the service role key
 * for secure server-side execution (e.g. Next.js Route Handlers).
 */
export function getAdminSupabase(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  try {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return adminClient;
  } catch (err) {
    console.error("Failed to initialize Supabase Admin Client:", err);
    return null;
  }
}
