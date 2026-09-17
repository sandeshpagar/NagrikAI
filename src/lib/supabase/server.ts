import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./client";

/**
 * Server-side Supabase client for Server Components & Route Handlers
 */
export function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) return null;

  try {
    const cookieStore = cookies();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createServerClient } = require("@supabase/ssr");
    
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Can occur when called from Server Component
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch {
              // Can occur when called from Server Component
            }
          },
        },
      }
    );
  } catch {
    return null;
  }
}
