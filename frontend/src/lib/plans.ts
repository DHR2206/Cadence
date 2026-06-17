import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { StudySession, PlannerPlan, PlannerSettings } from "@/lib/plannerApi";

// Helper to convert week and day offsets to actual Date objects in the user's local timezone
export function calculateSessionDates(
  semesterStart: string, // YYYY-MM-DD
  week: number,
  day: string,
  startTime: string, // "HH:MM"
  endTime: string // "HH:MM"
) {
  const [year, month, dateNum] = semesterStart.split("-").map(Number);
  // Month is 0-indexed in JavaScript Date constructor
  const baseDate = new Date(year, month - 1, dateNum, 0, 0, 0);

  const daysOfWeek: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };
  const dayOffset = daysOfWeek[day] ?? 0;
  const totalDaysOffset = (week - 1) * 7 + dayOffset;

  const sessionDate = new Date(baseDate);
  sessionDate.setDate(baseDate.getDate() + totalDaysOffset);

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startsAt = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate(),
    startHour,
    startMinute,
    0
  );

  const endsAt = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate(),
    endHour,
    endMinute,
    0
  );

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

// Save a study plan and all of its associated sessions to Supabase
export async function saveStudyPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  plan: PlannerPlan,
  settings: PlannerSettings
) {
  // 1. Delete existing plans (which cascades to delete existing sessions)
  const { error: deleteError } = await supabase
    .from("study_plans")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  // 2. Insert the new study plan
  const { data: planRow, error: planError } = await supabase
    .from("study_plans")
    .insert({
      user_id: userId,
      generated_by: "planner",
      summary: plan.suggestion,
      metadata: {
        semester_start: settings.semesterStart,
        semester_weeks: settings.weeks,
        workload_by_week: plan.workloadByWeek,
        collisions: plan.collisions,
        summary: plan.summary
      }
    })
    .select()
    .single();

  if (planError) {
    throw planError;
  }

  // 3. Batch-insert study sessions
  if (plan.studyPlan.length > 0) {
    const sessionsPayload = plan.studyPlan.map((session) => {
      const { startsAt, endsAt } = calculateSessionDates(
        settings.semesterStart,
        session.week,
        session.day,
        session.start,
        session.end
      );

      return {
        plan_id: planRow.id,
        assignment_id: session.assignmentId || null,
        starts_at: startsAt,
        ends_at: endsAt,
        title: session.title || "Study Session",
        type: session.type || "study",
        status: "scheduled" as const
      };
    });

    const { error: sessionsError } = await supabase
      .from("study_sessions")
      .insert(sessionsPayload);

    if (sessionsError) {
      throw sessionsError;
    }
  }
}

// Load the active study plan and sessions from Supabase
export async function loadActiveStudyPlan(
  supabase: SupabaseClient<Database>
): Promise<{ plan: PlannerPlan; settings: PlannerSettings } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch the latest study plan
  const { data: planRow, error: planError } = await supabase
    .from("study_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError || !planRow) {
    return null;
  }

  // 2. Fetch all sessions for this plan, joining courses/assignments
  const { data: sessionRows, error: sessionError } = await supabase
    .from("study_sessions")
    .select(`
      *,
      assignment:assignments(
        *,
        course:courses(*)
      )
    `)
    .eq("plan_id", planRow.id)
    .order("starts_at", { ascending: true });

  if (sessionError || !sessionRows) {
    return null;
  }

  // Reconstruct PlannerSettings
  const metadata = planRow.metadata as any;
  const settings: PlannerSettings = {
    semesterStart: metadata?.semester_start || planRow.created_at.slice(0, 10),
    weeks: metadata?.semester_weeks || 12,
    availableHoursPerWeek: metadata?.summary?.available_hours_per_week || 10
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Reconstruct StudySession[]
  const studyPlan: StudySession[] = sessionRows.map((row) => {
    const startsAtDate = new Date(row.starts_at);
    const endsAtDate = new Date(row.ends_at);

    // Calculate relative week index
    const [sYear, sMonth, sDateNum] = settings.semesterStart.split("-").map(Number);
    const semStart = new Date(sYear, sMonth - 1, sDateNum, 0, 0, 0);
    const diffMs = startsAtDate.getTime() - semStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const week = Math.max(1, Math.floor(diffDays / 7) + 1);

    const day = daysOfWeek[startsAtDate.getDay()] || "Mon";

    const formatTime = (d: Date) => {
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    };

    const courseAssignment = row.assignment as any;
    const course = courseAssignment?.course?.code || courseAssignment?.course?.name || "General";

    return {
      week,
      day,
      start: formatTime(startsAtDate),
      end: formatTime(endsAtDate),
      course,
      title: row.title || "Study Session",
      hours: (endsAtDate.getTime() - startsAtDate.getTime()) / (1000 * 60 * 60),
      type: (row.type as "deep-work" | "study") || "study",
      assignmentId: row.assignment_id || undefined,
      starts_at: row.starts_at,
      ends_at: row.ends_at
    };
  });

  // Reconstruct PlannerPlan
  const plan: PlannerPlan = {
    workloadByWeek: metadata?.workload_by_week || [],
    collisions: metadata?.collisions || [],
    studyPlan,
    summary: metadata?.summary || {
      deadlineCount: 0,
      availableHoursPerWeek: settings.availableHoursPerWeek,
      peakBeforeHours: 0,
      peakAfterHours: 0,
      peakReductionPercent: 0,
      crunchWeeks: [],
      productivityScore: 82
    },
    suggestion: planRow.summary || "No severe collision detected."
  };

  return { plan, settings };
}

// Persist customized semester settings to user profile
export async function saveSemesterSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  semesterStart: string,
  weeks: number
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      semester_start: semesterStart,
      semester_weeks: weeks
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
