/**
 * Supabase Browser Client
 * Automatically connects to live Supabase Auth when credentials are provided,
 * or gracefully returns null in Developer Prototype Mode.
 */

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    url !== "https://your-project.supabase.co" &&
    !url.includes("your-project")
  );
};

let cachedClient: any = null;

export function createClient() {
  if (cachedClient) return cachedClient;
  if (!isSupabaseConfigured()) return null;

  try {
    // Dynamic import to prevent bundler errors if @supabase/ssr is not yet installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ssr = typeof window !== "undefined" ? require("@supabase/ssr") : null;
    if (ssr && ssr.createBrowserClient) {
      cachedClient = ssr.createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      return cachedClient;
    }
  } catch {
    // Supabase packages pending npm install
    return null;
  }

  return null;
}
