import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return createSupabaseBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createSupabaseBrowserClient<Database>(config.url, config.publishableKey);
}
