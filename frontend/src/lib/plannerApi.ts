export type Priority = "low" | "medium" | "high";
export type Risk = "low" | "medium" | "high" | "crunch";

export type DeadlineInput = {
  id: string;
  courseId?: string;
  course: string;
  title: string;
  dueDate: string;
  difficulty: number;
  estimatedHours: number | null;
  priority: Priority;
};

export type PlannerSettings = {
  semesterStart: string;
  weeks: number;
  availableHoursPerWeek: number;
};

type ApiDeadline = {
  id: string;
  course: string;
  title: string;
  due_date: string;
  difficulty: number;
  estimated_hours: number | null;
  priority: Priority;
};

type ApiPlanResponse = {
  workload_by_week: Array<{
    week: number;
    label: string;
    before_hours: number;
    after_hours: number;
    risk: Risk;
    optimized_risk: Risk;
    deadline_count: number;
  }>;
  collisions: Array<{
    week: number;
    deadline_count: number;
    total_hours: number;
    severity: Risk;
    deadlines: Array<{
      id: string;
      course: string;
      title: string;
      due_date: string;
      impact: "high" | "medium";
    }>;
  }>;
  study_plan: Array<{
    week: number;
    day: string;
    start: string;
    end: string;
    course: string;
    title: string;
    hours: number;
    type: "deep-work" | "study";
    assignment_id?: string;
  }>;
  summary: {
    deadline_count: number;
    available_hours_per_week: number;
    peak_before_hours: number;
    peak_after_hours: number;
    peak_reduction_percent: number;
    crunch_weeks: number[];
    productivity_score: number;
  };
  suggestion: string;
};

export type WorkloadWeek = {
  week: number;
  label: string;
  beforeHours: number;
  afterHours: number;
  risk: Risk;
  optimizedRisk: Risk;
  deadlineCount: number;
};

export type Collision = {
  week: number;
  deadlineCount: number;
  totalHours: number;
  severity: Risk;
  deadlines: Array<{
    id: string;
    course: string;
    title: string;
    dueDate: string;
    impact: "high" | "medium";
  }>;
};

export type StudySession = {
  week: number;
  day: string;
  start: string;
  end: string;
  course: string;
  title: string;
  hours: number;
  type: "deep-work" | "study";
  assignmentId?: string;
  starts_at?: string;
  ends_at?: string;
};

export type PlannerPlan = {
  workloadByWeek: WorkloadWeek[];
  collisions: Collision[];
  studyPlan: StudySession[];
  summary: {
    deadlineCount: number;
    availableHoursPerWeek: number;
    peakBeforeHours: number;
    peakAfterHours: number;
    peakReductionPercent: number;
    crunchWeeks: number[];
    productivityScore: number;
  };
  suggestion: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function toApiDeadline(deadline: DeadlineInput): ApiDeadline {
  return {
    id: deadline.id,
    course: deadline.course,
    title: deadline.title,
    due_date: deadline.dueDate,
    difficulty: deadline.difficulty,
    estimated_hours: deadline.estimatedHours,
    priority: deadline.priority
  };
}

function mapPlanResponse(response: ApiPlanResponse): PlannerPlan {
  return {
    workloadByWeek: response.workload_by_week.map((week) => ({
      week: week.week,
      label: week.label,
      beforeHours: week.before_hours,
      afterHours: week.after_hours,
      risk: week.risk,
      optimizedRisk: week.optimized_risk,
      deadlineCount: week.deadline_count
    })),
    collisions: response.collisions.map((collision) => ({
      week: collision.week,
      deadlineCount: collision.deadline_count,
      totalHours: collision.total_hours,
      severity: collision.severity,
      deadlines: collision.deadlines.map((deadline) => ({
        id: deadline.id,
        course: deadline.course,
        title: deadline.title,
        dueDate: deadline.due_date,
        impact: deadline.impact
      }))
    })),
    studyPlan: response.study_plan.map((session) => ({
      week: session.week,
      day: session.day,
      start: session.start,
      end: session.end,
      course: session.course,
      title: session.title,
      hours: session.hours,
      type: session.type,
      assignmentId: session.assignment_id
    })),
    summary: {
      deadlineCount: response.summary.deadline_count,
      availableHoursPerWeek: response.summary.available_hours_per_week,
      peakBeforeHours: response.summary.peak_before_hours,
      peakAfterHours: response.summary.peak_after_hours,
      peakReductionPercent: response.summary.peak_reduction_percent,
      crunchWeeks: response.summary.crunch_weeks,
      productivityScore: response.summary.productivity_score
    },
    suggestion: response.suggestion
  };
}

export async function generatePlannerPlan(settings: PlannerSettings, deadlines: DeadlineInput[]): Promise<PlannerPlan> {
  const response = await fetch(`${API_URL}/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      semester_start: settings.semesterStart,
      weeks: settings.weeks,
      available_hours_per_week: settings.availableHoursPerWeek,
      deadlines: deadlines.map(toApiDeadline)
    })
  });

  if (!response.ok) {
    throw new Error(`Planner API returned ${response.status}`);
  }

  return mapPlanResponse((await response.json()) as ApiPlanResponse);
}

export function createEmptyPlan(settings: PlannerSettings): PlannerPlan {
  return {
    workloadByWeek: Array.from({ length: settings.weeks }, (_, index) => ({
      week: index + 1,
      label: `W${index + 1}`,
      beforeHours: 0,
      afterHours: 0,
      risk: "low",
      optimizedRisk: "low",
      deadlineCount: 0
    })),
    collisions: [],
    studyPlan: [],
    summary: {
      deadlineCount: 0,
      availableHoursPerWeek: settings.availableHoursPerWeek,
      peakBeforeHours: 0,
      peakAfterHours: 0,
      peakReductionPercent: 0,
      crunchWeeks: [],
      productivityScore: 82
    },
    suggestion: "Add course deadlines to generate a collision forecast and balanced study plan."
  };
}
