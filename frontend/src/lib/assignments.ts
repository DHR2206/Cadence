import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import type { DeadlineInput, Priority } from "@/lib/plannerApi";

type CourseRow = Tables<"courses">;
type AssignmentRow = Tables<"assignments">;

const priorityToScore: Record<Priority, number> = {
  low: 1,
  medium: 3,
  high: 5
};

function scoreToPriority(priority: number | null): Priority {
  if (priority === null) {
    return "medium";
  }

  if (priority <= 2) {
    return "low";
  }

  if (priority >= 4) {
    return "high";
  }

  return "medium";
}

function dueDateFromTimestamp(value: string) {
  return value.slice(0, 10);
}

function dueDateToTimestamp(value: string) {
  return `${value}T23:59:00.000Z`;
}

function normalizeCourseCode(course: string) {
  return course.trim().toUpperCase();
}

function mapAssignment(row: AssignmentRow, coursesById: Map<string, CourseRow>): DeadlineInput {
  const course = coursesById.get(row.course_id);

  return {
    id: row.id,
    courseId: row.course_id,
    course: course?.code || course?.name || "COURSE",
    title: row.title,
    dueDate: dueDateFromTimestamp(row.due_at),
    difficulty: row.difficulty ?? 3,
    estimatedHours: row.estimated_hours,
    priority: scoreToPriority(row.priority)
  };
}

async function findOrCreateCourse(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseCode: string
) {
  const code = normalizeCourseCode(courseCode);

  const { data: existingCourse, error: selectError } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .eq("code", code)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingCourse) {
    return existingCourse;
  }

  const { data: createdCourse, error: insertError } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      code,
      name: code,
      color: "#0F56D9"
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return createdCourse;
}

export async function loadPersistedDeadlines(supabase: SupabaseClient<Database>) {
  const [{ data: courses, error: coursesError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: true }),
    supabase.from("assignments").select("*").order("due_at", { ascending: true })
  ]);

  if (coursesError) {
    throw coursesError;
  }

  if (assignmentsError) {
    throw assignmentsError;
  }

  const coursesById = new Map((courses ?? []).map((course) => [course.id, course]));

  return (assignments ?? []).map((assignment) => mapAssignment(assignment, coursesById));
}

export async function persistDeadline(
  supabase: SupabaseClient<Database>,
  userId: string,
  deadline: DeadlineInput
) {
  const course = await findOrCreateCourse(supabase, userId, deadline.course);
  const payload = {
    user_id: userId,
    course_id: course.id,
    title: deadline.title.trim(),
    due_at: dueDateToTimestamp(deadline.dueDate),
    estimated_hours: deadline.estimatedHours,
    difficulty: deadline.difficulty,
    priority: priorityToScore[deadline.priority],
    source: "manual" as const
  };

  if (deadline.courseId) {
    const { data, error } = await supabase
      .from("assignments")
      .update(payload)
      .eq("id", deadline.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapAssignment(data, new Map([[course.id, course]]));
  }

  const { data: existingAssignment, error: existingError } = await supabase
    .from("assignments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .eq("title", payload.title)
    .eq("due_at", payload.due_at)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingAssignment) {
    const { data, error } = await supabase
      .from("assignments")
      .update(payload)
      .eq("id", existingAssignment.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapAssignment(data, new Map([[course.id, course]]));
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapAssignment(data, new Map([[course.id, course]]));
}

export async function deletePersistedDeadline(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("assignments").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
