import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { generateGeminiContent } from "./rag";

export interface PlannerDeadline {
  id: string;
  courseId?: string;
  course: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  difficulty: number; // 1-5
  estimatedHours: number | null;
  priority: "low" | "medium" | "high";
}

export interface PlanningPreferences {
  weeklyCapacityHours: number;
  preferredStudyTime: "morning" | "afternoon" | "evening" | "night" | "flexible";
  focusDurationMinutes: number; // e.g., 25, 50, 90, 120
}

export interface ScheduledSession {
  week: number;
  day: string; // "Mon", "Tue", etc.
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  course: string;
  title: string;
  hours: number;
  type: "deep-work" | "study";
  assignmentId: string;
}

export interface PrioritizedTask {
  id: string;
  title: string;
  course: string;
  priorityScore: number; // 0-100
  riskScore: number; // 0-100
  priorityReasoning: string; // Explainable AI output
}

export interface GeneratedStudyPlanResult {
  studySessions: ScheduledSession[];
  prioritizedTasks: PrioritizedTask[];
  weeklyWorkload: Array<{
    week: number;
    label: string;
    beforeHours: number;
    afterHours: number;
    risk: "low" | "medium" | "high" | "crunch";
  }>;
  overallExplanation: string;
}

// Helper to convert due date into relative week
function getWeekIndex(semesterStartStr: string, dueDateStr: string, maxWeeks = 12): number {
  const start = new Date(semesterStartStr);
  const due = new Date(dueDateStr);
  const diffTime = due.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.max(1, Math.min(maxWeeks, Math.floor(diffDays / 7) + 1));
  return week;
}

// Get standard hour slots based on preference
function getPrefTimeRange(pref: string): { startHour: number; endHour: number } {
  switch (pref) {
    case "morning":
      return { startHour: 9, endHour: 12 };
    case "afternoon":
      return { startHour: 13, endHour: 16 };
    case "evening":
      return { startHour: 17, endHour: 20 };
    case "night":
      return { startHour: 20, endHour: 23 };
    case "flexible":
    default:
      return { startHour: 10, endHour: 18 };
  }
}

/**
 * Executes the custom scheduling algorithm, calculates Priority & Risk scores,
 * allocates study slots, and queries Gemini 2.5 Pro to provide natural explanations.
 */
export async function generateAIStudyPlan(
  semesterStart: string,
  totalWeeks: number,
  deadlines: PlannerDeadline[],
  prefs: PlanningPreferences
): Promise<GeneratedStudyPlanResult> {
  const weeks = Math.max(1, totalWeeks);
  const capacity = Math.max(1, prefs.weeklyCapacityHours);

  // 1. Calculate Priority and Risk Scores for each deadline
  const today = new Date();
  const prioritizedTasks: PrioritizedTask[] = [];

  const rawWeekHours = Array(weeks + 1).fill(0);
  const smoothedWeekHours = Array(weeks + 1).fill(0);

  // Calculate effort hours helper
  const getEffort = (d: PlannerDeadline) => {
    if (d.estimatedHours !== null && d.estimatedHours > 0) {
      return d.estimatedHours;
    }
    const priorityBoost = { low: 0.8, medium: 1.0, high: 1.3 }[d.priority];
    return Math.round((2.0 + d.difficulty * 1.5) * priorityBoost * 10) / 10;
  };

  const tasksWithCalculatedScores = deadlines.map((d) => {
    const effort = getEffort(d);
    const dueWeek = getWeekIndex(semesterStart, d.dueDate, weeks);
    rawWeekHours[dueWeek] += effort;

    // A. Priority Score Calculation
    const daysRemaining = Math.max(0.5, (new Date(d.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Urgency caps out at 100 if due in 1 day, reducing linearly
    const urgencyScore = Math.max(1, Math.min(100, 100 - (daysRemaining - 1) * 6));
    const difficultyScore = d.difficulty * 20; // Scale 1-5 to 0-100
    const effortScore = Math.min(100, effort * 6);

    const priorityScore = Math.round(0.4 * urgencyScore + 0.3 * difficultyScore + 0.3 * effortScore);

    // B. Risk Score Calculation
    // Risk is higher if the task is due soon and effort is large relative to available hours
    const prepWeeks = Math.max(1, Math.min(3, dueWeek));
    const totalCapacityInPrep = prepWeeks * capacity;
    const loadRatio = effort / totalCapacityInPrep;
    
    let baseRisk = Math.min(100, Math.round(loadRatio * 150));
    // Amplify risk if due date is within 3 days
    if (daysRemaining <= 3) {
      baseRisk = Math.min(100, baseRisk + 25);
    }
    const riskScore = Math.max(5, baseRisk);

    return {
      deadline: d,
      priorityScore,
      riskScore,
      effort
    };
  });

  // 2. Perform Workload Smoothing & Daily Slot Scheduling
  const studySessions: ScheduledSession[] = [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Sort by due date ascending to schedule oldest/earliest first
  const sortedTasks = [...tasksWithCalculatedScores].sort(
    (a, b) => new Date(a.deadline.dueDate).getTime() - new Date(b.deadline.dueDate).getTime()
  );

  for (const item of sortedTasks) {
    const dueWeek = getWeekIndex(semesterStart, item.deadline.dueDate, weeks);
    const effort = item.effort;
    
    // Smooth workload over preparation window
    const prepWindow = Math.max(1, Math.min(3, dueWeek));
    const candidateWeeks: number[] = [];
    for (let w = Math.max(1, dueWeek - prepWindow + 1); w <= dueWeek; w++) {
      candidateWeeks.push(w);
    }

    // Allocate hours per week based on linearly declining weights (closer to due date gets more prep hours)
    const weights = candidateWeeks.map((_, idx) => idx + 1); // e.g. [1, 2, 3]
    const weightSum = weights.reduce((a, b) => a + b, 0);

    candidateWeeks.forEach((week, index) => {
      const allocatedHours = Math.round((effort * weights[index]) / weightSum * 10) / 10;
      smoothedWeekHours[week] += allocatedHours;

      // Convert allocated hours to daily slots
      let remainingToSchedule = allocatedHours;
      let dayIndex = (week * 2) % 7; // Scatter starts across weekdays to balance load
      
      const { startHour, endHour } = getPrefTimeRange(prefs.preferredStudyTime);
      const slotDuration = prefs.focusDurationMinutes / 60; // chunk size

      while (remainingToSchedule > 0.1) {
        const sessionHours = Math.min(slotDuration, remainingToSchedule);
        const day = days[dayIndex % 7];
        const startH = startHour + (dayIndex % 2) * 2; // slight shift
        
        const startString = `${String(Math.floor(startH)).padStart(2, "0")}:00`;
        const endString = `${String(Math.floor(startH + Math.ceil(sessionHours))).padStart(2, "0")}:00`;

        studySessions.push({
          week,
          day,
          start: startString,
          end: endString,
          course: item.deadline.course,
          title: `${item.deadline.title} Study`,
          hours: sessionHours,
          type: item.deadline.difficulty >= 4 ? "deep-work" : "study",
          assignmentId: item.deadline.id
        });

        remainingToSchedule = Math.round((remainingToSchedule - sessionHours) * 10) / 10;
        dayIndex++;
      }
    });
  }

  // 3. Construct Weekly Workload Statistics
  const weeklyWorkload = [];
  const riskLabels = (hours: number, cap: number): "low" | "medium" | "high" | "crunch" => {
    const ratio = hours / cap;
    if (ratio >= 1.0) return "crunch";
    if (ratio >= 0.75) return "high";
    if (ratio >= 0.45) return "medium";
    return "low";
  };

  for (let w = 1; w <= weeks; w++) {
    weeklyWorkload.push({
      week: w,
      label: `W${w}`,
      beforeHours: Math.round(rawWeekHours[w] * 10) / 10,
      afterHours: Math.round(smoothedWeekHours[w] * 10) / 10,
      risk: riskLabels(smoothedWeekHours[w], capacity)
    });
  }

  // 4. Generate Explainable AI Descriptions using Gemini 2.5 Pro
  let overallExplanation = "Your study schedule has been smoothed across weeks to prevent crunch periods.";
  
  try {
    const scoreSummaryText = tasksWithCalculatedScores
      .map(
        (t) =>
          `- Course ${t.deadline.course}: "${t.deadline.title}" (Difficulty: ${t.deadline.difficulty}/5, Due: ${t.deadline.dueDate}) received Priority Score: ${t.priorityScore}/100 and Risk Score: ${t.riskScore}/100. Effort estimate: ${t.effort} hours.`
      )
      .join("\n");

    const prompt = `
You are the Cadence scheduling analyst.
Review the following study plan workload analysis:
Weekly Capacity: ${capacity} hours.
Preferred study window: ${prefs.preferredStudyTime} slots.
Tasks and priority metrics:
${scoreSummaryText}

Generate a JSON object with two fields:
1. "overallExplanation": A concise summary (2-3 sentences) of the stress forecast and optimization.
2. "taskExplanations": An array of objects, each containing:
   - "id": string (the task's id)
   - "reasoning": A short explanation (1-2 sentences) of why this specific task received its Priority Score and Risk Score (e.g., proximity, effort duration, load).

Output valid JSON matching this structure exactly. Do not output markdown codeblocks.
`;

    const aiResponseText = await generateGeminiContent(prompt, "pro", true);
    const parsedExplanation = JSON.parse(aiResponseText);

    overallExplanation = parsedExplanation.overallExplanation || overallExplanation;
    
    // Map reasoning back to prioritizedTasks list
    tasksWithCalculatedScores.forEach((t) => {
      const explainItem = parsedExplanation.taskExplanations?.find((item: any) => item.id === t.deadline.id);
      prioritizedTasks.push({
        id: t.deadline.id,
        title: t.deadline.title,
        course: t.deadline.course,
        priorityScore: t.priorityScore,
        riskScore: t.riskScore,
        priorityReasoning: explainItem?.reasoning || `Prioritized based on due date (${t.deadline.dueDate}) and estimated effort of ${t.effort} hours.`
      });
    });
  } catch (err) {
    console.error("Failed to generate AI planning explanations:", err);
    // Fallback static explanations if AI is unavailable or fails to parse
    tasksWithCalculatedScores.forEach((t) => {
      const days = Math.round((new Date(t.deadline.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const reason = `This task is due in ${days} days and requires ~${t.effort} hours of study. Delaying it increases workload risk.`;
      prioritizedTasks.push({
        id: t.deadline.id,
        title: t.deadline.title,
        course: t.deadline.course,
        priorityScore: t.priorityScore,
        riskScore: t.riskScore,
        priorityReasoning: reason
      });
    });
  }

  return {
    studySessions,
    prioritizedTasks,
    weeklyWorkload,
    overallExplanation
  };
}
