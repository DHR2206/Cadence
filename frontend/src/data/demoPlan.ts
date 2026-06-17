export type Risk = "low" | "medium" | "high" | "crunch";

export type WorkloadWeek = {
  week: number;
  label: string;
  beforeHours: number;
  afterHours: number;
  risk: Risk;
};

export type Deadline = {
  id: string;
  course: string;
  title: string;
  dueDate: string;
  impact: "High" | "Medium";
};

export type StudyBlock = {
  day: string;
  time: string;
  course: string;
  title: string;
  tone: "blue" | "cyan" | "peach" | "lavender";
};

export const workload: WorkloadWeek[] = [
  { week: 1, label: "W1", beforeHours: 6, afterHours: 8, risk: "low" },
  { week: 2, label: "W2", beforeHours: 11, afterHours: 13, risk: "medium" },
  { week: 3, label: "W3", beforeHours: 9, afterHours: 14, risk: "low" },
  { week: 4, label: "W4", beforeHours: 13, afterHours: 18, risk: "medium" },
  { week: 5, label: "W5", beforeHours: 8, afterHours: 20, risk: "low" },
  { week: 6, label: "W6", beforeHours: 28, afterHours: 21, risk: "crunch" },
  { week: 7, label: "W7", beforeHours: 14, afterHours: 16, risk: "medium" },
  { week: 8, label: "W8", beforeHours: 10, afterHours: 12, risk: "low" },
  { week: 9, label: "W9", beforeHours: 20, afterHours: 17, risk: "high" },
  { week: 10, label: "W10", beforeHours: 7, afterHours: 10, risk: "low" },
  { week: 11, label: "W11", beforeHours: 12, afterHours: 13, risk: "medium" },
  { week: 12, label: "W12", beforeHours: 9, afterHours: 9, risk: "low" }
];

export const collisions: Deadline[] = [
  {
    id: "cs401-project",
    course: "CS401",
    title: "AI Systems Final Project",
    dueDate: "Friday, 11:59 PM",
    impact: "High"
  },
  {
    id: "ma203-quiz",
    course: "MA203",
    title: "Probability Quiz",
    dueDate: "Thursday, 5:00 PM",
    impact: "High"
  },
  {
    id: "phy205-lab",
    course: "PHY205",
    title: "Kinetics Lab Report",
    dueDate: "Saturday, 11:59 PM",
    impact: "Medium"
  }
];

export const studyBlocks: StudyBlock[] = [
  { day: "Mon", time: "09:00 - 11:00", course: "CS401", title: "Project architecture", tone: "blue" },
  { day: "Mon", time: "13:00 - 14:30", course: "PHY205", title: "Lab data cleanup", tone: "cyan" },
  { day: "Tue", time: "10:00 - 12:00", course: "MA203", title: "Practice probability sets", tone: "peach" },
  { day: "Wed", time: "09:00 - 10:30", course: "CS401", title: "Model evaluation notes", tone: "blue" },
  { day: "Thu", time: "14:00 - 16:00", course: "PHY205", title: "Report draft", tone: "cyan" },
  { day: "Fri", time: "10:00 - 12:00", course: "CS305", title: "Algorithm review", tone: "lavender" }
];

export const plannedFeatures = [
  "Moodle and Google Classroom import",
  "Email or push reminders",
  "Club recommender for lighter weeks",
  "Calendar export and shared group plans"
];
