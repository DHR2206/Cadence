import { Save, SlidersHorizontal, Sparkles } from "lucide-react";
import { studyBlocks } from "@/data/demoPlan";

const tones = {
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
  peach: "border-orange-200 bg-orange-50 text-orange-900",
  lavender: "border-violet-200 bg-violet-50 text-violet-900"
};

export function StudyPlanner() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="glass-panel rounded-3xl p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-2xl font-bold">AI Study Planner</p>
            <p className="mt-1 text-sm text-muted">Balanced weekly plan generated from deadline pressure and available hours.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles size={17} />
              Auto-rebalance
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
            <p className="mt-2 text-xl font-bold">25h</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Primary focus</p>
            <p className="mt-2 text-xl font-bold">CS401 Project</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Peak energy</p>
            <p className="mt-2 text-xl font-bold">Morning</p>
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
                {studyBlocks
                  .filter((block) => block.day === day)
                  .map((block) => (
                    <div className={`rounded-xl border p-3 ${tones[block.tone]}`} key={`${block.day}-${block.time}`}>
                      <p className="text-xs font-semibold">{block.time}</p>
                      <p className="mt-2 font-bold">{block.course}</p>
                      <p className="mt-1 text-sm">{block.title}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-soft">
          <p className="font-bold text-primary">Cadence Insight</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Heavy quantitative tasks are scheduled during morning focus windows, with a short buffer after each deep-work block.
          </p>
          <button className="mt-4 w-full rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary">
            Apply Suggestion
          </button>
        </div>
        <div className="rounded-3xl border border-line bg-white/80 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Weekly workload</p>
          <div className="mt-6 flex items-end gap-2">
            <p className="text-3xl font-bold">22</p>
            <p className="pb-1 text-sm text-muted">/ 25 hrs</p>
            <span className="ml-auto rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">Optimal</span>
          </div>
          <div className="mt-4 h-3 rounded-full bg-slate-100">
            <div className="h-3 w-[88%] rounded-full bg-cyan" />
          </div>
        </div>
      </aside>
    </section>
  );
}
