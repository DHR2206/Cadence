import { Bell, Clock3, Flame, Gauge, Target, Zap } from "lucide-react";
import { CollisionPanel } from "@/components/CollisionPanel";
import { MetricCard } from "@/components/MetricCard";
import { Sidebar } from "@/components/Sidebar";
import { StudyPlanner } from "@/components/StudyPlanner";
import { WorkloadChart } from "@/components/WorkloadChart";
import { plannedFeatures, workload } from "@/data/demoPlan";

export default function Home() {
  return (
    <main className="min-h-screen lg:flex">
      <Sidebar />
      <section className="min-w-0 flex-1 px-5 py-6 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mid-Evaluation MVP</p>
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Cadence AI</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Deadline collision predictor and academic planner for DAU students. Built to surface crunch weeks early and convert
              scattered deadlines into a balanced study rhythm.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-soft">
              <Bell size={20} />
            </button>
            <div className="rounded-2xl bg-white p-1 shadow-soft">
              <button className="rounded-xl bg-mist px-4 py-2 text-sm font-semibold text-primary">Week</button>
              <button className="rounded-xl px-4 py-2 text-sm font-medium text-muted">Semester</button>
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Upcoming deadlines" value="4" detail="+2 this week" icon={Clock3} tone="red" />
          <MetricCard label="Workload score" value="8.5" detail="/ 10 high" icon={Gauge} tone="peach" />
          <MetricCard label="Study hours" value="24h" detail="+3h planned" icon={Target} tone="cyan" />
          <MetricCard label="Predicted stress" value="Elevated" detail="Week 6 risk" icon={Flame} tone="peach" />
          <MetricCard label="Productivity score" value="92%" detail="+5%" icon={Zap} tone="blue" />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1fr_24rem]">
          <WorkloadChart weeks={workload} />
          <CollisionPanel />
        </section>

        <section className="mb-8">
          <StudyPlanner />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="glass-panel rounded-3xl p-6 lg:col-span-2">
            <p className="text-xl font-bold">Current Progress</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["Repo structure", "Complete"],
                ["Planner engine", "Working"],
                ["Moodle import", "Planned"]
              ].map(([label, status]) => (
                <div className="rounded-2xl border border-line bg-white/70 p-4" key={label}>
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-2 text-lg font-bold">{status}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-xl font-bold">Planned Features</p>
            <ul className="mt-5 space-y-3">
              {plannedFeatures.map((feature) => (
                <li className="flex gap-3 text-sm text-slate-700" key={feature}>
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
