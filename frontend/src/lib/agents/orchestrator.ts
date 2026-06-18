import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { queryRAG, generateGeminiContent } from "../ai/rag";

export interface AgentResponse {
  agentName: string;
  responseHtml: string; // Markdown text response
  followUpSuggestions: string[];
}

// ----------------------------------------------------
// Agent System Prompts & Personalities
// ----------------------------------------------------

const PLANNER_AGENT_PROMPT = `
You are the Planner Agent for Cadence.
Your responsibility is to optimize the student's study calendar, perform time blocking, and prioritize tasks.
Focus on scheduling efficiency, balancing workloads, and resolving deadline collisions.
Provide highly actionable study plans, suggest daily study hours, and explain time-blocking allocations.
`;

const ACADEMIC_AGENT_PROMPT = `
You are the Academic Agent for Cadence.
Your responsibility is to explain academic concepts, support courses, and clarify syllabus questions.
Break down complex topics into digestible explanations (e.g. math proofs, software design patterns, machine learning theory).
Use clean formatting, analogies, and step-by-step guides. Do not talk about scheduling or internships.
`;

const PRODUCTIVITY_AGENT_PROMPT = `
You are the Productivity Agent for Cadence.
Your responsibility is to analyze habits, optimize focus routines, and monitor academic progress.
Advise on methods like Pomodoro, active recall, spaced repetition, and digital decluttering.
Reference the student's Focus Duration and Completion Rate metrics to give custom habit advice.
`;

const DEADLINE_AGENT_PROMPT = `
You are the Deadline Agent for Cadence.
Your responsibility is to evaluate deadline risks, analyze upcoming submissions, and identify overdue or endangered work.
Be direct about workload crunches. Identify peak overlap weeks (e.g. where multiple assignments are due) and highlight high-priority items.
`;

const CAREER_AGENT_PROMPT = `
You are the Career Agent for Cadence.
Your responsibility is to recommend internships, outline tech skill roadmaps, and offer resume/interview advice.
Link recommendations to the student's courses (e.g., since they study CS401 AI, suggest AI research/engineering positions).
Give step-by-step roadmaps for mastering industry tools.
`;

/**
 * Classifies the user's intent to route to the correct agent.
 */
export async function classifyAgentIntent(userPrompt: string): Promise<"planner" | "academic" | "productivity" | "deadline" | "career"> {
  const prompt = `
Categorize the following student query into one of these 5 categories:
1. "planner": Query about study scheduling, calendar allocation, time blocking, study plans, or task prioritization.
2. "academic": Query asking for concept explanations, coding help, syllabus questions, tutoring, or general course concepts.
3. "productivity": Query about focus, study habits, Pomodoro, study consistency, or learning optimization.
4. "deadline": Query checking upcoming due dates, calculating stress risk, checking crunch weeks, or highlighting critical upcoming bottlenecks.
5. "career": Query asking about internships, skill roadmaps, resume building, job search, or career paths.

User Query: "${userPrompt}"

Respond with ONLY one lowercase word from the following options: planner, academic, productivity, deadline, career. Do not include punctuation.
`;

  try {
    const classification = await generateGeminiContent(prompt, "flash");
    const cleaned = classification.trim().toLowerCase();
    if (["planner", "academic", "productivity", "deadline", "career"].includes(cleaned)) {
      return cleaned as any;
    }
  } catch (err) {
    console.error("Agent classification failed, defaulting to planner:", err);
  }
  return "planner";
}

/**
 * Runs a query through the multi-agent pipeline.
 */
export async function runAgentOrchestrator(
  supabase: SupabaseClient<Database>,
  userId: string,
  userPrompt: string,
  overrideAgent?: string
): Promise<AgentResponse> {
  // 1. Determine active agent via classification or override
  let activeAgentKey = overrideAgent?.toLowerCase() || "planner";
  if (!overrideAgent) {
    activeAgentKey = await classifyAgentIntent(userPrompt);
  }

  // 2. Select prompt and model based on agent routing
  let systemPrompt = "";
  let modelType: "flash" | "pro" = "flash";
  let agentDisplayName = "Planner Agent";
  let suggestions: string[] = [];

  switch (activeAgentKey) {
    case "academic":
      systemPrompt = ACADEMIC_AGENT_PROMPT;
      agentDisplayName = "Academic Agent";
      modelType = "flash";
      suggestions = ["Explain this concept in simple terms", "Give me a practice quiz on this", "What are the core topics?"];
      break;
    case "productivity":
      systemPrompt = PRODUCTIVITY_AGENT_PROMPT;
      agentDisplayName = "Productivity Agent";
      modelType = "flash";
      suggestions = ["How do I start a Pomodoro block?", "Improve my study consistency score", "How to avoid distractions?"];
      break;
    case "deadline":
      systemPrompt = DEADLINE_AGENT_PROMPT;
      agentDisplayName = "Deadline Agent";
      modelType = "flash";
      suggestions = ["Which weeks have the highest risk?", "Show assignments due this week", "Are any tasks overdue?"];
      break;
    case "career":
      systemPrompt = CAREER_AGENT_PROMPT;
      agentDisplayName = "Career Agent";
      modelType = "flash";
      suggestions = ["What projects should I build for my resume?", "Internships for AI students", "Suggest a backend skills roadmap"];
      break;
    case "planner":
    default:
      systemPrompt = PLANNER_AGENT_PROMPT;
      agentDisplayName = "Planner Agent";
      modelType = "pro"; // Planning and complex layout optimization uses Gemini Pro
      suggestions = ["Optimize my study plan", "Generate a new time-blocked schedule", "How were my priority scores calculated?"];
      break;
  }

  // 3. Query RAG pipeline injecting specialized agent instructions
  const agentResponseText = await queryRAG(supabase, userId, userPrompt, modelType, systemPrompt);

  return {
    agentName: agentDisplayName,
    responseHtml: agentResponseText,
    followUpSuggestions: suggestions
  };
}
