import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createSupabaseBrowserClient<Database>(config.url, config.publishableKey);
}
