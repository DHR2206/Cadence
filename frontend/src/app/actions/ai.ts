"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runAgentOrchestrator, AgentResponse } from "@/lib/agents/orchestrator";
import { getEmbedding } from "@/lib/ai/rag";
import { generateAIStudyPlan, ScheduledSession } from "@/lib/ai/planning-engine";
import {
  saveIntegrationCredentials,
  syncGoogleClassroom,
  syncGoogleCalendar,
  syncMoodle,
  SyncResult
} from "@/lib/services/integrations";
import { calculateSessionDates } from "@/lib/plans";

// Helper to assert user is authenticated
async function getAuthUser(supabase: any) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized access.");
  }
  return user;
}

/**
 * Chat Orchestrator Action: classified intent and routes to correct agent
 */
export async function chatWithAgentAction(
  prompt: string,
  overrideAgent?: string
): Promise<AgentResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const user = await getAuthUser(supabase);
  return runAgentOrchestrator(supabase, user.id, prompt, overrideAgent);
}

/**
 * AI Memory Ingestion: creates memory and vector embedding
 */
export async function saveAIMemoryAction(
  content: string,
  memoryType = "preference",
  metadata = {}
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const user = await getAuthUser(supabase);

  // Generate vector embedding via Gemini
  let embedding: number[] | null = null;
  try {
    embedding = await getEmbedding(content);
  } catch (err) {
    console.error("Failed to generate embedding for memory:", err);
  }

  const { data, error } = await (supabase.from("ai_memories") as any)
    .insert({
      user_id: user.id,
      memory_type: memoryType,
      content: content.trim(),
      embedding: embedding || undefined,
      metadata
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Sync Integrations Action
 */
export async function triggerSyncAction(
  provider: "google_classroom" | "google_calendar" | "moodle",
  simulate = true
): Promise<SyncResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const user = await getAuthUser(supabase);

  switch (provider) {
    case "google_classroom":
      return syncGoogleClassroom(supabase, user.id, simulate);
    case "google_calendar":
      return syncGoogleCalendar(supabase, user.id, simulate);
    case "moodle":
      return syncMoodle(supabase, user.id, simulate);
    default:
      throw new Error(`Unsupported sync provider: ${provider}`);
  }
}

export async function saveMoodleIntegrationAction(moodleUrl: string, token: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const user = await getAuthUser(supabase);
  const normalizedUrl = moodleUrl.trim().replace(/\/+$/, "");
  const trimmedToken = token.trim();

  if (!normalizedUrl || !trimmedToken) {
    throw new Error("Moodle URL and token are required.");
  }

  try {
    new URL(normalizedUrl);
  } catch {
    throw new Error("Moodle URL must be a valid URL.");
  }

  return saveIntegrationCredentials(supabase, user.id, {
    provider: "moodle",
    externalUserId: normalizedUrl,
    accessToken: trimmedToken
  });
}

/**
 * Planning Engine Server Action: Runs the custom scheduling algorithm,
 * creates DB study plan + study sessions, and returns formatted result.
 */
export async function generateAIPlanAction(simulateExplanations = false) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const user = await getAuthUser(supabase);

  // 1. Fetch current profile settings & deadlines
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      course:courses(*)
    `)
    .eq("user_id", user.id);

  if (!profile) throw new Error("Student profile not found.");

  // Format assignments for planning input
  const plannerDeadlines = (assignments || []).map((a: any) => ({
    id: a.id,
    courseId: a.course_id,
    course: a.course?.code || "COURSE",
    title: a.title,
    dueDate: a.due_at.slice(0, 10),
    difficulty: a.difficulty || 3,
    estimatedHours: a.estimated_hours,
    priority: a.priority >= 4 ? ("high" as const) : a.priority <= 2 ? ("low" as const) : ("medium" as const)
  }));

  const settings = {
    semesterStart: profile.semester_start || new Date().toISOString().slice(0, 10),
    weeks: profile.semester_weeks || 12,
    availableHoursPerWeek: profile.weekly_capacity_hours || 25
  };

  const prefs = {
    weeklyCapacityHours: profile.weekly_capacity_hours,
    preferredStudyTime: (profile.preferred_study_time as any) || "flexible",
    focusDurationMinutes: 120 // Default to 2-hour slots
  };

  // 2. Execute planning algorithm
  const result = await generateAIStudyPlan(
    settings.semesterStart,
    settings.weeks,
    plannerDeadlines,
    prefs
  );

  // 3. Persist the generated plan & sessions to DB (cascading deletes existing)
  await supabase.from("study_plans").delete().eq("user_id", user.id);

  const { data: planRow, error: planError } = await supabase
    .from("study_plans")
    .insert({
      user_id: user.id,
      generated_by: "hybrid",
      summary: result.overallExplanation,
      metadata: {
        semester_start: settings.semesterStart,
        semester_weeks: settings.weeks,
        workload_by_week: result.weeklyWorkload,
        collisions: result.prioritizedTasks.filter(t => t.riskScore >= 75),
        prioritized_tasks: result.prioritizedTasks,
        summary: {
          deadline_count: plannerDeadlines.length,
          available_hours_per_week: settings.availableHoursPerWeek,
          peak_before_hours: Math.max(...result.weeklyWorkload.map(w => w.beforeHours)),
          peak_after_hours: Math.max(...result.weeklyWorkload.map(w => w.afterHours)),
          peak_reduction_percent: 15, // estimated improvement
          crunch_weeks: result.weeklyWorkload.filter(w => w.risk === "crunch").map(w => w.week)
        }
      } as any
    })
    .select()
    .single();

  if (planError) throw planError;

  // Insert study sessions
  if (result.studySessions.length > 0) {
    const sessionsPayload = result.studySessions.map((session) => {
      const { startsAt, endsAt } = calculateSessionDates(
        settings.semesterStart,
        session.week,
        session.day,
        session.start,
        session.end
      );

      return {
        plan_id: planRow.id,
        assignment_id: session.assignmentId,
        starts_at: startsAt,
        ends_at: endsAt,
        title: session.title,
        type: session.type,
        status: "scheduled" as const
      };
    });

    const { error: sessionsError } = await supabase
      .from("study_sessions")
      .insert(sessionsPayload);

    if (sessionsError) throw sessionsError;
  }

  return result;
}

/**
 * Saves or updates today's productivity metrics in DB
 */
export async function saveProductivityMetricsAction(metrics: {
  completionRate: number;
  focusDuration: number;
  missedDeadlines: number;
  studyConsistency: number;
  strongestSubjects?: string[];
  weakestSubjects?: string[];
}) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const user = await getAuthUser(supabase);
  const todayStr = new Date().toISOString().slice(0, 10);

  const payload = {
    user_id: user.id,
    metric_date: todayStr,
    completion_rate: metrics.completionRate,
    focus_duration_minutes: metrics.focusDuration,
    missed_deadlines: metrics.missedDeadlines,
    study_consistency_score: metrics.studyConsistency,
    strongest_subjects: metrics.strongestSubjects || [],
    weakest_subjects: metrics.weakestSubjects || []
  };

  const { data: existing } = await (supabase.from("productivity_metrics") as any)
    .select("id")
    .eq("user_id", user.id)
    .eq("metric_date", todayStr)
    .maybeSingle();

  if (existing) {
    const { error } = await (supabase.from("productivity_metrics") as any)
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await (supabase.from("productivity_metrics") as any)
      .insert(payload);
    if (error) throw error;
  }

  return { success: true };
}

/**
 * Loads AI memories
 */
export async function loadAIMemoriesAction() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const user = await getAuthUser(supabase).catch(() => null);
  if (!user) return [];

  const { data } = await (supabase.from("ai_memories") as any)
    .select("id, memory_type, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}
