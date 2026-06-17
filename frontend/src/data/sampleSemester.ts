import type { DeadlineInput, PlannerSettings } from "@/lib/plannerApi";

export const sampleSettings: PlannerSettings = {
  semesterStart: "2026-06-22",
  weeks: 12,
  availableHoursPerWeek: 25
};

export const sampleDeadlines: DeadlineInput[] = [
  {
    id: "cs401-project",
    course: "CS401",
    title: "AI Systems Final Project",
    dueDate: "2026-07-31",
    difficulty: 5,
    estimatedHours: 14,
    priority: "high"
  },
  {
    id: "ma203-quiz",
    course: "MA203",
    title: "Probability Quiz",
    dueDate: "2026-07-30",
    difficulty: 4,
    estimatedHours: 8,
    priority: "high"
  },
  {
    id: "phy205-lab",
    course: "PHY205",
    title: "Lab Report: Kinetics",
    dueDate: "2026-08-01",
    difficulty: 3,
    estimatedHours: 6,
    priority: "medium"
  },
  {
    id: "hs101-essay",
    course: "HS101",
    title: "Ethics Reflection Essay",
    dueDate: "2026-08-14",
    difficulty: 2,
    estimatedHours: 5,
    priority: "medium"
  },
  {
    id: "cs305-algo",
    course: "CS305",
    title: "Algorithms Assignment",
    dueDate: "2026-08-27",
    difficulty: 4,
    estimatedHours: 10,
    priority: "high"
  }
];
