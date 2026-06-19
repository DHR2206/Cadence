import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { decrypt, encrypt } from "@/lib/security/encryption";

type IntegrationProvider = Database["public"]["Enums"]["integration_provider"];

interface SaveIntegrationCredentialsInput {
  provider: IntegrationProvider;
  externalUserId?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
}

export interface SyncResult {
  success: boolean;
  message: string;
  coursesSynced: number;
  assignmentsSynced: number;
  eventsSynced: number;
}

export async function saveIntegrationCredentials(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: SaveIntegrationCredentialsInput
) {
  const encryptedAccessToken = encrypt(input.accessToken);
  const encryptedRefreshToken = input.refreshToken ? encrypt(input.refreshToken) : null;

  const { data, error } = await supabase
    .from("integrations")
    .upsert(
      {
        user_id: userId,
        provider: input.provider,
        external_user_id: input.externalUserId ?? null,
        encrypted_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: input.expiresAt ?? null
      },
      { onConflict: "user_id,provider" }
    )
    .select("id, provider, external_user_id, expires_at, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function fetchMoodleRest(
  moodleUrl: string,
  token: string,
  params: Record<string, string>
) {
  const body = new URLSearchParams({
    wstoken: token,
    moodlewsrestformat: "json",
    ...params
  });

  return fetch(`${moodleUrl}/webservice/rest/server.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}

// ----------------------------------------------------
// Google Classroom Aggregation & Normalization
// ----------------------------------------------------
export async function syncGoogleClassroom(
  supabase: SupabaseClient<Database>,
  userId: string,
  simulate = true
): Promise<SyncResult> {
  if (simulate) {
    // Generate realistic simulated Classroom data
    const simulatedCourses = [
      { code: "CS401", name: "AI Systems Engineering", color: "#2563EB" },
      { code: "MAT302", name: "Linear Algebra & Applications", color: "#7C3AED" }
    ];

    const today = new Date();
    const simulatedAssignments = [
      {
        courseCode: "CS401",
        title: "Programming Assignment 2: Multi-Agent Chat",
        description: "Implement a cooperative agent system using Gemini 2.5 Pro.",
        dueOffsetDays: 3,
        estimatedHours: 8,
        difficulty: 4,
        priority: 4 // High
      },
      {
        courseCode: "MAT302",
        title: "Weekly Problem Set 5",
        description: "Exercises on Singular Value Decomposition (SVD).",
        dueOffsetDays: 5,
        estimatedHours: 4,
        difficulty: 3,
        priority: 3 // Medium
      }
    ];

    let coursesSyncedCount = 0;
    let assignmentsSyncedCount = 0;

    for (const c of simulatedCourses) {
      // Find or create course
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .select("id")
        .eq("user_id", userId)
        .eq("code", c.code)
        .maybeSingle();

      let courseId = course?.id;

      if (!courseId && !courseErr) {
        const { data: newCourse, error: insErr } = await supabase
          .from("courses")
          .insert({
            user_id: userId,
            code: c.code,
            name: c.name,
            color: c.color
          })
          .select("id")
          .single();
        if (!insErr && newCourse) {
          courseId = newCourse.id;
          coursesSyncedCount++;
        }
      } else if (courseId) {
        coursesSyncedCount++;
      }

      if (!courseId) continue;

      // Sync assignments for this course
      const assignmentsForCourse = simulatedAssignments.filter((a) => a.courseCode === c.code);
      for (const a of assignmentsForCourse) {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + a.dueOffsetDays);
        dueDate.setHours(23, 59, 0, 0);

        const { data: existing } = await supabase
          .from("assignments")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .eq("title", a.title)
          .maybeSingle();

        if (!existing) {
          await supabase.from("assignments").insert({
            user_id: userId,
            course_id: courseId,
            title: a.title,
            description: a.description,
            due_at: dueDate.toISOString(),
            estimated_hours: a.estimatedHours,
            difficulty: a.difficulty,
            priority: a.priority,
            source: "google_classroom"
          });
          assignmentsSyncedCount++;
        }
      }
    }

    return {
      success: true,
      message: "Successfully synchronized Google Classroom (Simulated).",
      coursesSynced: coursesSyncedCount,
      assignmentsSynced: assignmentsSyncedCount,
      eventsSynced: 0
    };
  }

  // Real OAuth Ingestion Logic
  try {
    const { data: integration, error: intErr } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google_classroom")
      .maybeSingle();

    if (intErr || !integration) {
      throw new Error("Google Classroom integration not configured.");
    }

    const accessToken = decrypt(integration.encrypted_token);

    const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!coursesRes.ok) throw new Error("Failed to fetch Google Classroom courses.");
    const coursesData = await coursesRes.json();
    const coursesList = coursesData.courses || [];

    let coursesSynced = 0;
    let assignmentsSynced = 0;

    for (const c of coursesList) {
      if (c.courseState !== "ACTIVE") continue;

      const code = c.section ? `${c.name} (${c.section})` : c.name;
      
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("user_id", userId)
        .eq("code", c.name)
        .maybeSingle();

      let courseId = course?.id;
      if (!courseId) {
        const { data: newCourse } = await supabase
          .from("courses")
          .insert({
            user_id: userId,
            code: c.name,
            name: code,
            color: "#0F56D9"
          })
          .select("id")
          .single();
        courseId = newCourse?.id;
        coursesSynced++;
      } else {
        coursesSynced++;
      }

      if (!courseId) continue;

      // Fetch Coursework (assignments)
      const courseworkRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${c.id}/courseWork`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (courseworkRes.ok) {
        const courseworkData = await courseworkRes.json();
        const courseworkList = courseworkData.courseWork || [];

        for (const cw of courseworkList) {
          let dueAt = new Date().toISOString();
          if (cw.dueDate) {
            const { year, month, day } = cw.dueDate;
            const hour = cw.dueTime?.hours || 23;
            const minute = cw.dueTime?.minutes || 59;
            dueAt = new Date(year, month - 1, day, hour, minute).toISOString();
          }

          const { data: existing } = await supabase
            .from("assignments")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .eq("title", cw.title)
            .maybeSingle();

          if (!existing) {
            await supabase.from("assignments").insert({
              user_id: userId,
              course_id: courseId,
              title: cw.title,
              description: cw.description || "",
              due_at: dueAt,
              estimated_hours: 3.0, // Default estimate
              difficulty: 3, // Default difficulty
              priority: cw.workType === "ASSIGNMENT" ? 3 : 2,
              source: "google_classroom"
            });
            assignmentsSynced++;
          }
        }
      }
    }

    return {
      success: true,
      message: "Successfully synchronized Google Classroom.",
      coursesSynced,
      assignmentsSynced,
      eventsSynced: 0
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to sync Google Classroom.",
      coursesSynced: 0,
      assignmentsSynced: 0,
      eventsSynced: 0
    };
  }
}

// ----------------------------------------------------
// Google Calendar Aggregation & Normalization
// ----------------------------------------------------
export async function syncGoogleCalendar(
  supabase: SupabaseClient<Database>,
  userId: string,
  simulate = true
): Promise<SyncResult> {
  if (simulate) {
    const today = new Date();
    
    // Create classes, exams, and personal events
    const simulatedEvents = [
      {
        title: "CS401: AI Lecture Block",
        description: "Weekly lecture on deep learning and multi-agent frameworks.",
        event_type: "class",
        daysOffset: 1,
        hourStart: 10,
        durationHours: 2
      },
      {
        title: "Midterm Exam: Linear Algebra",
        description: "Exams on vectors, subspaces, and SVD.",
        event_type: "exam",
        daysOffset: 4,
        hourStart: 14,
        durationHours: 3
      },
      {
        title: "Weekly Career Guidance Workshop",
        description: "Resume feedback and networking skills.",
        event_type: "commitment",
        daysOffset: 2,
        hourStart: 16,
        durationHours: 1.5
      }
    ];

    let eventsSynced = 0;

    for (const e of simulatedEvents) {
      const startsAt = new Date(today);
      startsAt.setDate(today.getDate() + e.daysOffset);
      startsAt.setHours(e.hourStart, 0, 0, 0);

      const endsAt = new Date(startsAt);
      endsAt.setMinutes(startsAt.getMinutes() + e.durationHours * 60);

      // Check duplicate
      const { data: existing } = await (supabase.from("calendar_events") as any)
        .select("id")
        .eq("user_id", userId)
        .eq("title", e.title)
        .eq("starts_at", startsAt.toISOString())
        .maybeSingle();

      if (!existing) {
        await (supabase.from("calendar_events") as any).insert({
          user_id: userId,
          title: e.title,
          description: e.description,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          event_type: e.event_type,
          source: "google_calendar"
        });
        eventsSynced++;
      }
    }

    return {
      success: true,
      message: "Successfully synchronized Google Calendar (Simulated).",
      coursesSynced: 0,
      assignmentsSynced: 0,
      eventsSynced
    };
  }

  try {
    const { data: integration, error: intErr } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google_classroom") // Shared Google OAuth Token
      .maybeSingle();

    if (intErr || !integration) {
      throw new Error("Google Calendar integration not configured.");
    }

    const accessToken = decrypt(integration.encrypted_token);

    // Fetch primary calendar events for next 14 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const calendarRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calendarRes.ok) throw new Error("Failed to fetch Google Calendar events.");
    const calendarData = await calendarRes.json();
    const eventsList = calendarData.items || [];

    let eventsSynced = 0;

    for (const item of eventsList) {
      const startsAt = item.start?.dateTime || item.start?.date;
      const endsAt = item.end?.dateTime || item.end?.date;
      if (!startsAt || !endsAt) continue;

      const title = item.summary || "Untitled Event";
      
      const { data: existing } = await (supabase.from("calendar_events") as any)
        .select("id")
        .eq("user_id", userId)
        .eq("title", title)
        .eq("starts_at", new Date(startsAt).toISOString())
        .maybeSingle();

      if (!existing) {
        // Classify event type loosely from title keywords
        let eventType = "personal";
        const t = title.toLowerCase();
        if (t.includes("class") || t.includes("lecture") || t.includes("tutorial")) {
          eventType = "class";
        } else if (t.includes("exam") || t.includes("quiz") || t.includes("midterm") || t.includes("test")) {
          eventType = "exam";
        } else if (t.includes("workshop") || t.includes("club") || t.includes("meeting")) {
          eventType = "commitment";
        }

        await (supabase.from("calendar_events") as any).insert({
          user_id: userId,
          title,
          description: item.description || "",
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          event_type: eventType,
          source: "google_calendar",
          external_id: item.id
        });
        eventsSynced++;
      }
    }

    return {
      success: true,
      message: "Successfully synchronized Google Calendar.",
      coursesSynced: 0,
      assignmentsSynced: 0,
      eventsSynced
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to sync Google Calendar.",
      coursesSynced: 0,
      assignmentsSynced: 0,
      eventsSynced: 0
    };
  }
}

// ----------------------------------------------------
// Moodle Aggregation & Normalization
// ----------------------------------------------------
export async function syncMoodle(
  supabase: SupabaseClient<Database>,
  userId: string,
  simulate = true
): Promise<SyncResult> {
  if (simulate) {
    const simulatedCourses = [
      { code: "SWE311", name: "Software Architecture", color: "#EA580C" }
    ];

    const today = new Date();
    const simulatedAssignments = [
      {
        courseCode: "SWE311",
        title: "Assignment 3: Architectural Style Analysis",
        description: "Submit a report comparing Microservices vs Monolith architectures for a high-load system.",
        dueOffsetDays: 7,
        estimatedHours: 6,
        difficulty: 3,
        priority: 3
      }
    ];

    let coursesSyncedCount = 0;
    let assignmentsSyncedCount = 0;

    for (const c of simulatedCourses) {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("user_id", userId)
        .eq("code", c.code)
        .maybeSingle();

      let courseId = course?.id;

      if (!courseId) {
        const { data: newCourse } = await supabase
          .from("courses")
          .insert({
            user_id: userId,
            code: c.code,
            name: c.name,
            color: c.color
          })
          .select("id")
          .single();
        if (newCourse) {
          courseId = newCourse.id;
          coursesSyncedCount++;
        }
      } else {
        coursesSyncedCount++;
      }

      if (!courseId) continue;

      for (const a of simulatedAssignments) {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + a.dueOffsetDays);
        dueDate.setHours(23, 59, 0, 0);

        const { data: existing } = await supabase
          .from("assignments")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .eq("title", a.title)
          .maybeSingle();

        if (!existing) {
          await supabase.from("assignments").insert({
            user_id: userId,
            course_id: courseId,
            title: a.title,
            description: a.description,
            due_at: dueDate.toISOString(),
            estimated_hours: a.estimatedHours,
            difficulty: a.difficulty,
            priority: a.priority,
            source: "moodle"
          });
          assignmentsSyncedCount++;
        }
      }
    }

    return {
      success: true,
      message: "Successfully synchronized Moodle (Simulated).",
      coursesSynced: coursesSyncedCount,
      assignmentsSynced: assignmentsSyncedCount,
      eventsSynced: 0
    };
  }

  try {
    const { data: integration, error: intErr } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "moodle")
      .maybeSingle();

    if (intErr || !integration) {
      throw new Error("Moodle integration not configured.");
    }

    const token = decrypt(integration.encrypted_token);
    const moodleUrl = integration.external_user_id || "https://moodle.example.com";

    const coursesRes = await fetchMoodleRest(moodleUrl, token, {
      wsfunction: "core_enrol_get_users_courses"
    });
    if (!coursesRes.ok) throw new Error("Failed to fetch Moodle courses.");
    const coursesList = await coursesRes.json();

    if (coursesList.exception) {
      throw new Error(`Moodle API Exception: ${coursesList.message}`);
    }

    let coursesSynced = 0;
    let assignmentsSynced = 0;

    for (const c of coursesList) {
      const code = c.shortname || `Moodle-${c.id}`;
      
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("user_id", userId)
        .eq("code", code)
        .maybeSingle();

      let courseId = course?.id;
      if (!courseId) {
        const { data: newCourse } = await supabase
          .from("courses")
          .insert({
            user_id: userId,
            code,
            name: c.fullname,
            color: "#EA580C"
          })
          .select("id")
          .single();
        courseId = newCourse?.id;
        coursesSynced++;
      } else {
        coursesSynced++;
      }

      if (!courseId) continue;

      const assignRes = await fetchMoodleRest(moodleUrl, token, {
        wsfunction: "mod_assign_get_assignments",
        "courseids[0]": String(c.id)
      });
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        // Moodle returns courses list containing assignments
        const moodleCourse = assignData.courses?.[0];
        const assignmentsList = moodleCourse?.assignments || [];

        for (const moodleAssign of assignmentsList) {
          const dueDate = new Date(moodleAssign.duedate * 1000).toISOString();

          const { data: existing } = await supabase
            .from("assignments")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .eq("title", moodleAssign.name)
            .maybeSingle();

          if (!existing) {
            await supabase.from("assignments").insert({
              user_id: userId,
              course_id: courseId,
              title: moodleAssign.name,
              description: moodleAssign.intro || "",
              due_at: dueDate,
              estimated_hours: 4.0, // Default estimate
              difficulty: 3, // Default difficulty
              priority: 3, // Medium priority
              source: "moodle"
            });
            assignmentsSynced++;
          }
        }
      }
    }

    return {
      success: true,
      message: "Successfully synchronized Moodle.",
      coursesSynced,
      assignmentsSynced,
      eventsSynced: 0
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to sync Moodle.",
      coursesSynced: 0,
      assignmentsSynced: 0,
      eventsSynced: 0
    };
  }
}
