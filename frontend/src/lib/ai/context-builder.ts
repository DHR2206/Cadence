import type { StudentContextData } from "./retrieval";

/**
 * Normalizes and builds a structured Markdown context from student data
 * to supply to Gemini model prompts.
 */
export function buildStudentContext(data: StudentContextData): string {
  const lines: string[] = [];

  lines.push("### STUDENT PROFILE");
  const p = data.profile;
  lines.push(`- **University:** ${p.university_name || "Unspecified"}`);
  lines.push(`- **Semester:** ${p.semester || "Unspecified"}`);
  lines.push(`- **Timezone:** ${p.timezone || "UTC"}`);
  lines.push(`- **Weekly Capacity:** ${p.weekly_capacity_hours || 10} hours`);
  lines.push(`- **Preferred Study Time:** ${p.preferred_study_time || "Flexible"}`);
  lines.push(`- **Semester Start:** ${p.semester_start || "Unspecified"}`);
  lines.push(`- **Semester Length:** ${p.semester_weeks || 12} weeks`);
  lines.push("");

  lines.push("### COURSES");
  if (data.courses.length > 0) {
    data.courses.forEach((c) => {
      lines.push(`- **${c.code}**: ${c.name}`);
    });
  } else {
    lines.push("No active courses registered.");
  }
  lines.push("");

  lines.push("### UPCOMING ASSIGNMENTS & DEADLINES");
  if (data.assignments.length > 0) {
    data.assignments.forEach((a) => {
      const due = new Date(a.due_at).toLocaleDateString();
      lines.push(
        `- **[${a.source}] ${a.title}** (Course ID: ${a.course_id})` +
        `\n  Due: ${due} | Est. Hours: ${a.estimated_hours || "N/A"} | Difficulty: ${a.difficulty || 3}/5 | Priority: ${a.priority || 3}/5`
      );
    });
  } else {
    lines.push("No upcoming assignments or deadlines.");
  }
  lines.push("");

  lines.push("### EXAM SCHEDULE");
  if (data.exams.length > 0) {
    data.exams.forEach((ex) => {
      const dateStr = new Date(ex.exam_date).toLocaleString();
      lines.push(
        `- **${ex.title}** (Weight: ${ex.weight ? `${ex.weight}%` : "N/A"})` +
        `\n  Date: ${dateStr} | Duration: ${ex.duration_minutes}m | Location: ${ex.location || "Online"}`
      );
    });
  } else {
    lines.push("No scheduled exams.");
  }
  lines.push("");

  lines.push("### CALENDAR EVENTS (CLASSES & COMMITMENTS)");
  if (data.calendarEvents.length > 0) {
    data.calendarEvents.forEach((ev) => {
      const start = new Date(ev.starts_at).toLocaleString();
      const end = new Date(ev.ends_at).toLocaleString();
      lines.push(
        `- **${ev.title}** [Type: ${ev.event_type}]` +
        `\n  Time: ${start} to ${end}`
      );
    });
  } else {
    lines.push("No calendar events recorded.");
  }
  lines.push("");

  lines.push("### CURRENT STUDY SCHEDULE (SESSIONS)");
  if (data.studySessions.length > 0) {
    // Only list upcoming or recently completed sessions
    const now = new Date();
    const activeSessions = data.studySessions.filter(
      (s) => new Date(s.ends_at) >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    if (activeSessions.length > 0) {
      activeSessions.forEach((s) => {
        const start = new Date(s.starts_at).toLocaleString();
        lines.push(`- **${s.title}** (${s.type}) | Start: ${start} | Status: ${s.status}`);
      });
    } else {
      lines.push("No active study sessions scheduled in the next few days.");
    }
  } else {
    lines.push("No study plan sessions generated yet.");
  }
  lines.push("");

  lines.push("### PRODUCTIVITY METRICS");
  if (data.productivityMetrics.length > 0) {
    const latest = data.productivityMetrics[0];
    lines.push(`- **Daily Study Completion Rate:** ${latest.completion_rate}%`);
    lines.push(`- **Focus Duration Today:** ${latest.focus_duration_minutes} minutes`);
    lines.push(`- **Missed Deadlines (Semester):** ${latest.missed_deadlines}`);
    lines.push(`- **Study Consistency Score:** ${latest.study_consistency_score}%`);
    lines.push(`- **Strongest Subjects:** ${latest.strongest_subjects?.join(", ") || "None recorded"}`);
    lines.push(`- **Weakest Subjects:** ${latest.weakest_subjects?.join(", ") || "None recorded"}`);
  } else {
    lines.push("No productivity metrics recorded yet. Default values: Completion 100%, Consistency 80%.");
  }
  lines.push("");

  lines.push("### PERSISTENT AI LEARNING MEMORIES");
  if (data.semanticMemories.length > 0) {
    data.semanticMemories.forEach((m) => {
      lines.push(`- [Type: ${m.memory_type}] "${m.content}"`);
    });
  } else {
    lines.push("No customized learning memories matching the query found.");
  }

  return lines.join("\n");
}
