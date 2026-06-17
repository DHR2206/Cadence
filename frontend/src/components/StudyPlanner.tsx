import { Bot, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import type { StudySession } from "@/lib/plannerApi";

const tones = {
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
  peach: "border-orange-200 bg-orange-50 text-orange-900",
  lavender: "border-violet-200 bg-violet-50 text-violet-900"
};

type StudyPlannerProps = {
  sessions: StudySession[];
  availableHours: number;
  isLoading: boolean;
  onGenerate: () => void;
  preferredStudyTime?: string | null;
  primaryFocus?: string | null;
};

function toneForSession(session: StudySession): keyof typeof tones {
  if (session.type === "deep-work") {
    return "blue";
  }
  if (session.course.toLowerCase().includes("phy")) {
    return "cyan";
  }
  if (session.course.toLowerCase().includes("ma")) {
    return "peach";
  }
  return "lavender";
}

export function StudyPlanner({
  sessions,
  availableHours,
  isLoading,
  onGenerate,
  preferredStudyTime = "morning",
  primaryFocus = "General"
}: StudyPlannerProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const visibleSessions = sessions.slice(0, 12);
  const totalHours = sessions.reduce((sum, session) => sum + session.hours, 0);
  const cappedHours = Math.min(availableHours, Math.round(totalHours));

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="glass-panel rounded-3xl p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-2xl font-bold">AI Study Planner</p>
            <p className="mt-1 text-sm text-muted">Balanced weekly plan generated from deadline pressure and available hours.</p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
              disabled={isLoading}
              onClick={onGenerate}
              type="button"
            >
              <Sparkles size={17} />
              {isLoading ? "Balancing..." : "Auto-rebalance"}
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
              <Save size={17} />
              Save Plan
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-2xl border border-line bg-white/72 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Study hours / week</p>
            <p className="mt-2 text-xl font-bold">{availableHours}h</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Primary focus</p>
            <p className="mt-2 text-xl font-bold capitalize">{primaryFocus || "General"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Peak energy</p>
            <p className="mt-2 text-xl font-bold capitalize">{preferredStudyTime || "Morning"}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          <p className="font-bold">Weekly Timetable</p>
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">
            <SlidersHorizontal size={14} />
            Drag-ready layout
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {days.map((day) => (
            <div className="min-h-52 rounded-2xl bg-slate-50/80 p-3" key={day}>
              <p className="mb-3 text-center text-sm font-semibold text-slate-700">{day}</p>
              <div className="space-y-3">
                {visibleSessions
                  .filter((block) => block.day === day)
                  .map((block) => (
                    <div className={`rounded-xl border p-3 ${tones[toneForSession(block)]}`} key={`${block.week}-${block.day}-${block.start}-${block.title}`}>
                      <p className="text-xs font-semibold">{block.start} - {block.end}</p>
                      <p className="mt-2 font-bold">{block.course}</p>
                      <p className="mt-1 text-sm">{block.title}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        {sessions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-line bg-white/70 p-5 text-sm leading-6 text-muted">
            Generate a plan after adding deadlines. Cadence will place study blocks here by weekday and task type.
          </div>
        ) : null}
      </div>

      <aside className="space-y-6">
        {/* Cadence Insight Bot Box */}
        <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 shadow-soft">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
              <Bot size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Cadence Insight</p>
              <p className="text-xs text-muted mt-0.5">Automated suggestions</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-700">
            You&apos;ve scheduled heavy quantitative tasks during your peak morning hours. Excellent. Consider adding a 15-minute buffer after Calculus on Wednesday.
          </p>
          <button className="mt-4 w-full rounded-xl border border-primary bg-white py-2 text-xs font-bold text-primary hover:bg-blue-50 transition" type="button">
            Apply Suggestion
          </button>
        </div>

        {/* Weekly Workload Progress */}
        <div className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Weekly workload</p>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-3xl font-extrabold text-ink">{cappedHours}</p>
            <p className="pb-1 text-sm text-muted">/ {availableHours} hrs</p>
            <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Optimal</span>
          </div>
          <div className="mt-4 h-3.5 rounded-full bg-slate-100 overflow-hidden">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 shadow-glow" 
              style={{ width: `${Math.min(100, (cappedHours / availableHours) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Upcoming Milestones</p>
            <button className="text-xs font-bold text-muted hover:text-ink">•••</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink">Calculus Midterm</p>
                <p className="text-[10px] font-semibold text-muted mt-0.5">Oct 24 • In 3 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink">CS Project Alpha Draft</p>
                <p className="text-[10px] font-semibold text-muted mt-0.5">Oct 28 • In 7 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink">Physics Lab Report</p>
                <p className="text-[10px] font-semibold text-muted mt-0.5">Nov 02 • In 12 days</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
