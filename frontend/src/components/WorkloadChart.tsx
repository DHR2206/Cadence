import type { WorkloadWeek } from "@/lib/plannerApi";

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

      <div className="grid h-80 grid-cols-6 items-end gap-3 border-t border-line pt-6 md:grid-cols-12">
        {weeks.map((week) => (
          <div className="flex h-full flex-col items-center justify-end gap-2 hover:scale-[1.03] transition-all duration-300" key={week.label}>
            <div className="flex h-60 w-full max-w-12 items-end justify-center gap-1 rounded-full bg-slate-50/50 p-1 border border-slate-100">
              <div
                className={`${riskColor[week.risk]} w-3.5 rounded-t-full opacity-30 transition-all duration-500 ease-out`}
                style={{ height: `${(week.beforeHours / maxHours) * 100}%` }}
                title={`${week.label} before: ${week.beforeHours}h`}
              />
              <div
                className="w-3.5 rounded-t-full bg-gradient-to-t from-blue-600 to-primary shadow-glow transition-all duration-500 ease-out"
                style={{ height: `${(week.afterHours / maxHours) * 100}%` }}
                title={`${week.label} after: ${week.afterHours}h`}
              />
            </div>
            <span className={`text-xs font-semibold ${week.risk === "crunch" ? "text-red-600" : "text-slate-500"}`}>
              {week.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
