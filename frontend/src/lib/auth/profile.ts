import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

function profileNameFromUser(user: User) {
  const metadata = user.user_metadata;
  const value =
    metadata?.full_name ??
    metadata?.name ??
    metadata?.display_name ??
    user.email?.split("@")[0] ??
    null;

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
  context: string
): Promise<Profile | null> {
  console.info("[auth] ensuring profile", {
    context,
    userId: user.id,
    email: user.email ?? null
  });

  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[auth] profile lookup failed", {
      context,
      userId: user.id,
      error: selectError.message
    });
    return null;
  }

  if (existingProfile) {
    console.info("[auth] profile exists", {
      context,
      userId: user.id,
      onboardingCompleted: existingProfile.onboarding_completed
    });
    return existingProfile;
  }

  const insertPayload: ProfileInsert = {
    id: user.id,
    full_name: profileNameFromUser(user)
  };

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert(insertPayload)
    .select("*")
    .single();

  if (!insertError) {
    console.info("[auth] profile created", {
      context,
      userId: user.id,
      onboardingCompleted: createdProfile.onboarding_completed
    });
    return createdProfile;
  }

  if (insertError.code === "23505") {
    const { data: racedProfile, error: racedSelectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (racedSelectError) {
      console.error("[auth] profile lookup after duplicate insert failed", {
        context,
        userId: user.id,
        error: racedSelectError.message
      });
      return null;
    }

    console.info("[auth] profile already created by concurrent request", {
      context,
      userId: user.id
    });
    return racedProfile;
  }

  console.error("[auth] profile creation failed", {
    context,
    userId: user.id,
    error: insertError.message,
    code: insertError.code
  });
  return null;
}
