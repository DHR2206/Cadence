export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // The Supabase JS client requires the anon key (a JWT starting with "eyJ...").
  // Prefer NEXT_PUBLIC_SUPABASE_ANON_KEY over NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  // because the short publishable key format ("sb_publishable_...") does not work
  // for server-side API calls like exchangeCodeForSession().
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}
