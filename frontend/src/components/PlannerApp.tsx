"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock3, Flame, Gauge, Target, Zap } from "lucide-react";
import { CollisionPanel } from "@/components/CollisionPanel";
import { DeadlineForm } from "@/components/DeadlineForm";
import { DeadlineList } from "@/components/DeadlineList";
import { MetricCard } from "@/components/MetricCard";
import { MobileSectionNav } from "@/components/MobileSectionNav";
import { SectionId, Sidebar } from "@/components/Sidebar";
import { StudyPlanner } from "@/components/StudyPlanner";
import { WorkloadChart } from "@/components/WorkloadChart";
import { sampleDeadlines, sampleSettings } from "@/data/sampleSemester";
import {
  createEmptyPlan,
  DeadlineInput,
  generatePlannerPlan,
  PlannerPlan,
  PlannerSettings
} from "@/lib/plannerApi";

const STORAGE_KEY = "cadence-planner-state-v1";

type StoredPlannerState = {
  settings: PlannerSettings;
  deadlines: DeadlineInput[];
  plan: PlannerPlan | null;
};

const defaultSettings: PlannerSettings = {
  semesterStart: sampleSettings.semesterStart,
  weeks: sampleSettings.weeks,
  availableHoursPerWeek: sampleSettings.availableHoursPerWeek
};

function stressLabel(plan: PlannerPlan) {
  if (plan.summary.crunchWeeks.length > 0) {
    return "Elevated";
  }
  if (plan.collisions.length > 0) {
    return "Watch";
  }
  return "Calm";
}

function workloadScore(plan: PlannerPlan) {
  if (plan.summary.deadlineCount === 0) {
    return "0.0";
  }
  if (plan.summary.availableHoursPerWeek <= 0) {
    return "0.0";
  }
  const ratio = plan.summary.peakBeforeHours / plan.summary.availableHoursPerWeek;
  return Math.min(10, Math.max(1, ratio * 8)).toFixed(1);
}

function isStoredPlannerState(value: unknown): value is StoredPlannerState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<StoredPlannerState>;
  return Boolean(record.settings && Array.isArray(record.deadlines));
}

export function PlannerApp() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [settings, setSettings] = useState<PlannerSettings>(defaultSettings);
  const [deadlines, setDeadlines] = useState<DeadlineInput[]>([]);
  const [plan, setPlan] = useState<PlannerPlan>(() => createEmptyPlan(defaultSettings));
  const [editingDeadline, setEditingDeadline] = useState<DeadlineInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (isStoredPlannerState(parsed)) {
          setSettings(parsed.settings);
          setDeadlines(parsed.deadlines);
          setPlan(parsed.plan ?? createEmptyPlan(parsed.settings));
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const state: StoredPlannerState = { settings, deadlines, plan };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [deadlines, hydrated, plan, settings]);

  const nextDeadlineCount = useMemo(() => {
    const today = new Date();
    return deadlines.filter((deadline) => new Date(deadline.dueDate) >= today).length;
  }, [deadlines]);

  async function generatePlan(nextSettings = settings, nextDeadlines = deadlines) {
    setError(null);
    if (nextDeadlines.length === 0) {
      setPlan(createEmptyPlan(nextSettings));
      return;
    }

    setIsLoading(true);
    try {
      const generated = await generatePlannerPlan(nextSettings, nextDeadlines);
      setPlan(generated);
      setActiveSection("dashboard");
    } catch {
      setError("Planner backend is unavailable. Start it with: cd backend && uvicorn app.main:app --reload --port 8000");
    } finally {
      setIsLoading(false);
    }
  }

  function saveDeadline(deadline: DeadlineInput) {
    setDeadlines((current) => {
      const exists = current.some((item) => item.id === deadline.id);
      if (exists) {
        return current.map((item) => (item.id === deadline.id ? deadline : item));
      }
      return [...current, deadline].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    });
    setEditingDeadline(null);
  }

  function deleteDeadline(id: string) {
    setDeadlines((current) => {
      const nextDeadlines = current.filter((deadline) => deadline.id !== id);
      if (nextDeadlines.length === 0) {
        setPlan(createEmptyPlan(settings));
      }
      return nextDeadlines;
    });
    setEditingDeadline((current) => (current?.id === id ? null : current));
  }

  function updateSettings(nextSettings: PlannerSettings) {
    const normalizedSettings = {
      ...nextSettings,
      weeks: Math.max(1, Math.min(24, nextSettings.weeks || 1)),
      availableHoursPerWeek: Math.max(1, nextSettings.availableHoursPerWeek || 1)
    };
    setSettings(normalizedSettings);
    if (deadlines.length === 0) {
      setPlan(createEmptyPlan(normalizedSettings));
    }
  }

  function loadSampleData() {
    setSettings(sampleSettings);
    setDeadlines(sampleDeadlines);
    setEditingDeadline(null);
    void generatePlan(sampleSettings, sampleDeadlines);
  }

  const dashboard = (
    <>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Upcoming deadlines" value={`${nextDeadlineCount}`} detail={`${deadlines.length} total`} icon={Clock3} tone="red" />
        <MetricCard label="Workload score" value={workloadScore(plan)} detail="/ 10 peak" icon={Gauge} tone="peach" />
        <MetricCard label="Study hours" value={`${Math.round(plan.summary.peakAfterHours)}h`} detail="peak after plan" icon={Target} tone="cyan" />
        <MetricCard label="Predicted stress" value={stressLabel(plan)} detail={`${plan.summary.crunchWeeks.length} crunch week(s)`} icon={Flame} tone="peach" />
        <MetricCard label="Productivity score" value={`${plan.summary.productivityScore}%`} detail={`+${plan.summary.peakReductionPercent}%`} icon={Zap} tone="blue" />
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <WorkloadChart weeks={plan.workloadByWeek} />
        <CollisionPanel collisions={plan.collisions} suggestion={plan.suggestion} isLoading={isLoading} onGenerate={() => void generatePlan()} />
      </section>

      {deadlines.length === 0 ? (
        <section className="glass-panel mb-8 rounded-3xl p-6">
          <p className="text-xl font-bold">Start with deadlines</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Add a task manually or load the DAU sample data. Once deadlines exist, Cadence can generate collision warnings and a
            balanced weekly study plan.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => setActiveSection("courses")} type="button">
              Add Deadline
            </button>
            <button className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-primary" onClick={loadSampleData} type="button">
              Load DAU Sample
            </button>
          </div>
        </section>
      ) : null}
    </>
  );

  const courses = (
    <div className="space-y-6">
      <DeadlineForm
        editingDeadline={editingDeadline}
        isLoading={isLoading}
        onCancelEdit={() => setEditingDeadline(null)}
        onGenerate={() => void generatePlan()}
        onLoadSample={loadSampleData}
        onSave={saveDeadline}
        onSettingsChange={updateSettings}
        settings={settings}
      />
      <DeadlineList deadlines={deadlines} onDelete={deleteDeadline} onEdit={setEditingDeadline} />
    </div>
  );

  const analytics = (
    <section className="glass-panel rounded-3xl p-6">
      <p className="text-2xl font-bold">Analytics</p>
      <p className="mt-1 text-sm text-muted">A compact view of the planner response and feasibility signals.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Peak before" value={`${plan.summary.peakBeforeHours}h`} detail="raw deadline week" icon={Flame} tone="red" />
        <MetricCard label="Peak after" value={`${plan.summary.peakAfterHours}h`} detail="balanced plan" icon={Target} tone="cyan" />
        <MetricCard label="Reduction" value={`${plan.summary.peakReductionPercent}%`} detail="peak smoothing" icon={Gauge} tone="blue" />
        <MetricCard label="Collisions" value={`${plan.collisions.length}`} detail="detected weeks" icon={Clock3} tone="peach" />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white/75">
        <div className="grid grid-cols-5 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted">
          <span>Week</span>
          <span>Before</span>
          <span>After</span>
          <span>Risk</span>
          <span>Deadlines</span>
        </div>
        {plan.workloadByWeek.map((week) => (
          <div className="grid grid-cols-5 border-t border-line px-4 py-3 text-sm" key={week.week}>
            <span className="font-semibold">{week.label}</span>
            <span>{week.beforeHours}h</span>
            <span>{week.afterHours}h</span>
            <span className="capitalize">{week.risk}</span>
            <span>{week.deadlineCount}</span>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen lg:flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <section className="min-w-0 flex-1 px-5 py-6 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Functional MVP</p>
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Cadence AI</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Add deadlines, generate a real backend-powered plan, and switch between dashboard, courses, study plan, and analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-soft" type="button">
              <Bell size={20} />
            </button>
            <button
              className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-primary shadow-soft"
              onClick={loadSampleData}
              type="button"
            >
              Load Sample
            </button>
            <button
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
              disabled={isLoading}
              onClick={() => void generatePlan()}
              type="button"
            >
              {isLoading ? "Generating..." : "Generate Plan"}
            </button>
          </div>
        </header>

        <MobileSectionNav activeSection={activeSection} onSectionChange={setActiveSection} />

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        {activeSection === "dashboard" ? dashboard : null}
        {activeSection === "courses" ? courses : null}
        {activeSection === "study-plan" ? (
          <StudyPlanner sessions={plan.studyPlan} availableHours={settings.availableHoursPerWeek} isLoading={isLoading} onGenerate={() => void generatePlan()} />
        ) : null}
        {activeSection === "analytics" ? analytics : null}
      </section>
    </main>
  );
}
