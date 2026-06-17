import type { WorkloadWeek } from "@/data/demoPlan";

const riskColor = {
  low: "bg-blue-500",
  medium: "bg-cyan-400",
  high: "bg-orange-500",
  crunch: "bg-red-600"
};

export function WorkloadChart({ weeks }: { weeks: WorkloadWeek[] }) {
  const maxHours = Math.max(...weeks.map((week) => Math.max(week.beforeHours, week.afterHours)), 1);

  return (
    <section className="glass-panel rounded-3xl p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xl font-bold">Workload Forecast</p>
          <p className="mt-1 text-sm text-muted">Semester timeline comparing raw deadlines against Cadence rebalancing.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-blue-500" /> Low</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-cyan-400" /> Medium</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-orange-500" /> High</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-red-600" /> Crunch</span>
        </div>
      </div>

      <div className="grid h-80 grid-cols-12 items-end gap-3 border-t border-line pt-6">
        {weeks.map((week) => (
          <div className="flex h-full flex-col items-center justify-end gap-2" key={week.label}>
            <div className="flex h-60 w-full max-w-12 items-end justify-center gap-1 rounded-full">
              <div
                className={`${riskColor[week.risk]} w-4 rounded-t-full opacity-35`}
                style={{ height: `${(week.beforeHours / maxHours) * 100}%` }}
                title={`${week.label} before: ${week.beforeHours}h`}
              />
              <div
                className="w-4 rounded-t-full bg-primary shadow-glow"
                style={{ height: `${(week.afterHours / maxHours) * 100}%` }}
                title={`${week.label} after: ${week.afterHours}h`}
              />
            </div>
            <span className={`text-xs font-semibold ${week.risk === "crunch" ? "text-red-700" : "text-slate-700"}`}>
              {week.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
