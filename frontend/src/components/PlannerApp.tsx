"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock3, Flame, Gauge, Target, Zap } from "lucide-react";
import type { Tables } from "@/types/database";
import { CollisionPanel } from "@/components/CollisionPanel";
import { DeadlineForm } from "@/components/DeadlineForm";
import { DeadlineList } from "@/components/DeadlineList";
import { MetricCard } from "@/components/MetricCard";
import { MobileSectionNav } from "@/components/MobileSectionNav";
import { SectionId, Sidebar } from "@/components/Sidebar";
import { StudyPlanner } from "@/components/StudyPlanner";
import { WorkloadChart } from "@/components/WorkloadChart";
import { CalendarView } from "@/components/CalendarView";
import { sampleDeadlines, sampleSettings } from "@/data/sampleSemester";
import { deletePersistedDeadline, loadPersistedDeadlines, persistDeadline } from "@/lib/assignments";
import {
  createEmptyPlan,
  DeadlineInput,
  generatePlannerPlan,
  PlannerPlan,
  PlannerSettings
} from "@/lib/plannerApi";
import { createBrowserClient } from "@/lib/supabase/browser";
import { loadActiveStudyPlan, saveStudyPlan, saveSemesterSettings } from "@/lib/plans";

type PlannerAppProps = {
  user: {
    id: string;
    email: string;
  };
  initialProfile: Tables<"profiles"> | null;
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

function displayName(profile: PlannerAppProps["initialProfile"], email: string) {
  return profile?.full_name || email || "Student";
}

export function PlannerApp({ user, initialProfile }: PlannerAppProps) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [settings, setSettings] = useState<PlannerSettings>({
    semesterStart: initialProfile?.semester_start ?? defaultSettings.semesterStart,
    weeks: initialProfile?.semester_weeks ?? defaultSettings.weeks,
    availableHoursPerWeek: initialProfile?.weekly_capacity_hours ?? defaultSettings.availableHoursPerWeek
  });
  const [deadlines, setDeadlines] = useState<DeadlineInput[]>([]);
  const [plan, setPlan] = useState<PlannerPlan>(() =>
    createEmptyPlan({
      semesterStart: initialProfile?.semester_start ?? defaultSettings.semesterStart,
      weeks: initialProfile?.semester_weeks ?? defaultSettings.weeks,
      availableHoursPerWeek: initialProfile?.weekly_capacity_hours ?? defaultSettings.availableHoursPerWeek
    })
  );
  const [editingDeadline, setEditingDeadline] = useState<DeadlineInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setError(null);
      setIsSyncing(true);
      try {
        const persistedDeadlines = await loadPersistedDeadlines(supabase);
        if (isMounted) {
          setDeadlines(persistedDeadlines);
        }

        const activePlanResult = await loadActiveStudyPlan(supabase);
        if (isMounted && activePlanResult) {
          setPlan(activePlanResult.plan);
          setSettings((current) => ({
            ...current,
            semesterStart: activePlanResult.settings.semesterStart,
            weeks: activePlanResult.settings.weeks,
            availableHoursPerWeek: activePlanResult.settings.availableHoursPerWeek
          }));
        }
      } catch {
        if (isMounted) {
          setError("Cadence could not load your persisted deadlines or study plan from Supabase.");
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

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

  async function saveDeadline(deadline: DeadlineInput) {
    setError(null);
    try {
      const persistedDeadline = await persistDeadline(supabase, user.id, deadline);
      setDeadlines((current) => {
        const exists = current.some((item) => item.id === persistedDeadline.id);
        const nextDeadlines = exists
          ? current.map((item) => (item.id === persistedDeadline.id ? persistedDeadline : item))
          : [...current, persistedDeadline];

        return nextDeadlines.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      });
      setEditingDeadline(null);
    } catch {
      setError("Cadence could not save this deadline. Check your Supabase connection and RLS policies.");
      throw new Error("Deadline save failed");
    }
  }

  async function deleteDeadline(id: string) {
    setError(null);
    try {
      await deletePersistedDeadline(supabase, id);
      setDeadlines((current) => {
        const nextDeadlines = current.filter((deadline) => deadline.id !== id);
        if (nextDeadlines.length === 0) {
          setPlan(createEmptyPlan(settings));
        }
        return nextDeadlines;
      });
      setEditingDeadline((current) => (current?.id === id ? null : current));
    } catch {
      setError("Cadence could not delete this deadline from Supabase.");
    }
  }

  function updateSettings(nextSettings: PlannerSettings) {
    const normalizedSettings = {
      ...nextSettings,
      weeks: Math.max(1, Math.min(24, nextSettings.weeks || 1)),
      availableHoursPerWeek: Math.max(1, nextSettings.availableHoursPerWeek || 1)
    };
    setSettings(normalizedSettings);
    
    // Persist capacity
    if (normalizedSettings.availableHoursPerWeek !== settings.availableHoursPerWeek) {
      void supabase
        .from("profiles")
        .update({ weekly_capacity_hours: Math.round(normalizedSettings.availableHoursPerWeek) })
        .eq("id", user.id);
    }

    // Persist semester_start / semester_weeks
    if (
      normalizedSettings.semesterStart !== settings.semesterStart ||
      normalizedSettings.weeks !== settings.weeks
    ) {
      void saveSemesterSettings(supabase, user.id, normalizedSettings.semesterStart, normalizedSettings.weeks);
    }

    if (deadlines.length === 0) {
      setPlan(createEmptyPlan(normalizedSettings));
    }
  }

  async function handleSavePlan() {
    setError(null);
    setIsSavingPlan(true);
    try {
      await saveStudyPlan(supabase, user.id, plan, settings);
    } catch {
      setError("Cadence could not save your study plan to Supabase.");
    } finally {
      setIsSavingPlan(false);
    }
  }

  async function loadSampleData() {
    setError(null);
    setIsSyncing(true);
    setSettings(sampleSettings);
    setEditingDeadline(null);
    try {
      const persistedSamples: DeadlineInput[] = [];
      for (const deadline of sampleDeadlines) {
        persistedSamples.push(await persistDeadline(supabase, user.id, deadline));
      }
      setDeadlines((current) => {
        const byTitleAndCourse = new Map(current.map((deadline) => [`${deadline.course}:${deadline.title}`, deadline]));
        persistedSamples.forEach((deadline) => {
          byTitleAndCourse.set(`${deadline.course}:${deadline.title}`, deadline);
        });
        return Array.from(byTitleAndCourse.values()).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      });
      void generatePlan(sampleSettings, persistedSamples);
    } catch {
      setError("Cadence could not persist the DAU sample data to Supabase.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/auth/sign-in");
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
            Add a task manually or load the DAU sample data. Cadence stores your deadlines in Supabase and uses them to generate
            collision warnings and a balanced weekly study plan.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => setActiveSection("courses")} type="button">
              Add Deadline
            </button>
            <button className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-primary" onClick={() => void loadSampleData()} type="button">
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
        onLoadSample={() => void loadSampleData()}
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
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSignOut={() => void signOut()}
        userEmail={user.email}
        userName={displayName(initialProfile, user.email)}
      />
      <section className="min-w-0 flex-1 px-5 py-6 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {initialProfile?.university_name || "Academic Workspace"}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Cadence AI {initialProfile?.semester ? `• ${initialProfile.semester}` : ""}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Add deadlines, keep them synced to Supabase, and generate a backend-powered plan from your academic workload.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-soft" type="button">
              <Bell size={20} />
            </button>
            <button
              className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-primary shadow-soft"
              onClick={() => void loadSampleData()}
              type="button"
            >
              {isSyncing ? "Syncing..." : "Load Sample"}
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

        {isSyncing ? (
          <div className="mb-6 rounded-2xl border border-line bg-white/75 p-4 text-sm font-medium text-muted">
            Syncing your Supabase deadlines...
          </div>
        ) : null}

        {activeSection === "dashboard" ? dashboard : null}
        {activeSection === "courses" ? courses : null}
        {activeSection === "study-plan" ? (
          <StudyPlanner
            availableHours={settings.availableHoursPerWeek}
            isLoading={isLoading}
            onGenerate={() => void generatePlan()}
            onSavePlan={handleSavePlan}
            isSavingPlan={isSavingPlan}
            preferredStudyTime={initialProfile?.preferred_study_time}
            primaryFocus={deadlines[0]?.course || "General"}
            sessions={plan.studyPlan}
          />
        ) : null}
        {activeSection === "calendar" ? (
          <CalendarView
            sessions={plan.studyPlan}
            deadlines={deadlines}
            settings={settings}
          />
        ) : null}
        {activeSection === "analytics" ? analytics : null}
      </section>
    </main>
  );
}
