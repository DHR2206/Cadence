import { AlertTriangle, Bot, Sparkles } from "lucide-react";
import { collisions } from "@/data/demoPlan";

export function CollisionPanel() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-red-200 bg-red-50/70 p-5 shadow-soft">
        <div className="mb-5 flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xl font-bold">Deadline Collision</p>
            <p className="mt-1 font-semibold text-red-700">3 major deadlines in Week 6</p>
          </div>
        </div>
        <div className="space-y-3">
          {collisions.map((deadline) => (
            <div className="rounded-2xl border border-red-100 bg-white/70 p-4" key={deadline.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{deadline.course}</p>
                  <p className="text-sm text-muted">{deadline.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{deadline.dueDate}</p>
                </div>
                <span className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                  {deadline.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700">
          <Sparkles size={17} />
          Auto-fix Schedule
        </button>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-white/80 p-5 shadow-soft">
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
              Cadence moved 7 hours of CS401 and MA203 preparation into Weeks 4 and 5, lowering Week 6 from
              crunch risk to an optimized 21-hour workload.
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
