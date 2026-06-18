import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getEmbedding } from "./rag";

export interface StudentContextData {
  profile: any;
  courses: any[];
  assignments: any[];
  calendarEvents: any[];
  studySessions: any[];
  exams: any[];
  productivityMetrics: any[];
  semanticMemories: any[];
}

/**
 * Retrieves all relevant academic data and AI memory for a student
 * to construct a personalized prompt context.
 */
export async function retrieveStudentContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  query?: string
): Promise<StudentContextData> {
  // 1. Fetch academic tables concurrently
  const [
    { data: profile },
    { data: courses },
    { data: assignments },
    { data: calendarEvents },
    { data: studySessions },
    { data: exams },
    { data: productivityMetrics }
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("courses").select("*").eq("user_id", userId),
    supabase.from("assignments").select("*").eq("user_id", userId).order("due_at", { ascending: true }),
    (supabase.from("calendar_events") as any).select("*").eq("user_id", userId).order("starts_at", { ascending: true }),
    supabase.from("study_sessions").select(`
      *,
      plan:study_plans(*)
    `).order("starts_at", { ascending: true }),
    (supabase.from("exam_schedule") as any).select("*").eq("user_id", userId).order("exam_date", { ascending: true }),
    (supabase.from("productivity_metrics") as any).select("*").eq("user_id", userId).order("metric_date", { ascending: false }).limit(10)
  ]);

  // Filter study sessions that belong to the user's study plans
  const userStudySessions = (studySessions ?? []).filter(
    (session: any) => session.plan?.user_id === userId
  );

  // 2. Fetch semantic memories if a query is provided and we have a Gemini API key
  let semanticMemories: any[] = [];
  if (query && query.trim().length > 0) {
    try {
      const queryEmbedding = await getEmbedding(query);
      if (queryEmbedding) {
        const { data: matchedMemories } = await supabase.rpc("match_ai_memories" as any, {
          query_embedding: queryEmbedding,
          match_threshold: 0.3, // Return reasonably similar memories
          match_count: 5,
          filter_user_id: userId
        });
        if (matchedMemories) {
          semanticMemories = matchedMemories;
        }
      }
    } catch (err) {
      console.warn("Could not retrieve semantic memories:", err);
      // Fallback: fetch recent memories without vector search
      const { data: recentMemories } = await (supabase.from("ai_memories") as any)
        .select("id, memory_type, content, metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (recentMemories) {
        semanticMemories = (recentMemories as any[]).map((m: any) => ({ ...m, similarity: 1.0 }));
      }
    }
  } else {
    // If no query, fetch most recent general memories
    const { data: recentMemories } = await (supabase.from("ai_memories") as any)
      .select("id, memory_type, content, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (recentMemories) {
      semanticMemories = (recentMemories as any[]).map((m: any) => ({ ...m, similarity: 1.0 }));
    }
  }

  return {
    profile: profile || {},
    courses: courses || [],
    assignments: assignments || [],
    calendarEvents: calendarEvents || [],
    studySessions: userStudySessions,
    exams: exams || [],
    productivityMetrics: productivityMetrics || [],
    semanticMemories
  };
}
