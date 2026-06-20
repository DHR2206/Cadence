import { AlertTriangle, Bot, Sparkles } from "lucide-react";
import type { Collision } from "@/lib/plannerApi";

type CollisionPanelProps = {
  collisions: Collision[];
  suggestion: string;
  isLoading: boolean;
  onGenerate: () => void;
};

export function CollisionPanel({ collisions, suggestion, isLoading, onGenerate }: CollisionPanelProps) {
  const primaryCollision = collisions[0];
  const primaryDeadlines = primaryCollision?.deadlines ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-[#e5c7bd] bg-[#f7ebe6]/80 p-5 shadow-soft">
        <div className="mb-5 flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1d8d0] text-[#b85d4f]">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xl font-bold">{primaryCollision ? "Deadline Collision" : "No Collision Yet"}</p>
            <p className="mt-1 font-semibold text-[#9f493f]">
              {primaryCollision
                ? `${primaryCollision.deadlineCount} deadline${primaryCollision.deadlineCount === 1 ? "" : "s"} in Week ${primaryCollision.week}`
                : "Add deadlines or load sample data"}
            </p>
          </div>
        </div>
        {primaryCollision && primaryDeadlines.length > 0 ? (
          <div className="space-y-3">
            {primaryDeadlines.map((deadline) => (
              <div className="rounded-2xl border border-[#e5c7bd] bg-white/72 p-4" key={deadline.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{deadline.course}</p>
                  <p className="text-sm text-muted">{deadline.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{new Date(deadline.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="rounded-lg bg-[#f1d8d0] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9f493f]">
                  {deadline.impact}
                </span>
              </div>
            </div>
            ))}
          </div>
        ) : primaryCollision ? (
          <p className="rounded-2xl border border-[#e5c7bd] bg-white/72 p-4 text-sm leading-6 text-slate-700">
            Cadence detected a high-risk workload week, but the saved collision details need to be regenerated. Use Auto-fix
            Schedule to refresh the plan with deadline-level explanations.
          </p>
        ) : (
          <p className="rounded-2xl border border-[#e5c7bd] bg-white/72 p-4 text-sm leading-6 text-slate-700">
            Cadence will show collision details here when two or more deadlines land in the same week, or workload crosses the
            high-risk threshold.
          </p>
        )}
        <button
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-[#1b4758] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={onGenerate}
          type="button"
        >
          <Sparkles size={17} />
          {isLoading ? "Generating..." : "Auto-fix Schedule"}
        </button>
      </section>

      <section className="rounded-3xl border border-line bg-white/80 p-5 shadow-soft">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Bot size={22} />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-lg font-bold">AI Suggestion</p>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary">New</span>
            </div>
            <p className="text-sm leading-6 text-slate-700">
              {suggestion}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-muted">Dismiss</button>
              <button className="rounded-xl border border-primary px-3 py-2 text-sm font-semibold text-primary">Review</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
