import type { WorkloadWeek } from "@/lib/plannerApi";

const riskColor = {
  low: "bg-[#5d8b9b]",
  medium: "bg-[#78b8c6]",
  high: "bg-[#d39a6a]",
  crunch: "bg-[#b85d4f]"
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
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#5d8b9b]" /> Low</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#78b8c6]" /> Medium</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#d39a6a]" /> High</span>
          <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#b85d4f]" /> Crunch</span>
        </div>
      </div>

      <div className="grid h-80 grid-cols-6 items-end gap-3 border-t border-line pt-6 md:grid-cols-12">
        {weeks.map((week) => (
          <div className="flex h-full flex-col items-center justify-end gap-2 hover:scale-[1.03] transition-all duration-300" key={week.label}>
            <div className="flex h-60 w-full max-w-12 items-end justify-center gap-1 rounded-full border border-line bg-white/55 p-1">
              <div
                className={`${riskColor[week.risk]} w-3.5 rounded-t-full opacity-30 transition-all duration-500 ease-out`}
                style={{ height: `${(week.beforeHours / maxHours) * 100}%` }}
                title={`${week.label} before: ${week.beforeHours}h`}
              />
              <div
                className="w-3.5 rounded-t-full bg-gradient-to-t from-primary to-cyan shadow-glow transition-all duration-500 ease-out"
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
