import { redirect } from "next/navigation";
import { IntegrationsSettingsPanel } from "@/components/IntegrationsSettingsPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function IntegrationsSettingsPage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/auth/sign-in?next=/settings/integrations");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings/integrations");
  }

  const { data: statuses, error } = await supabase
    .from("integrations")
    .select("provider, status, last_synced_at, updated_at")
    .eq("user_id", user.id)
    .in("provider", ["google_classroom", "google_calendar"]);

  if (error) {
    throw error;
  }

  return <IntegrationsSettingsPanel initialStatuses={statuses ?? []} />;
}
