"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, RotateCcw, Save } from "lucide-react";
import type { DeadlineInput, PlannerSettings, Priority } from "@/lib/plannerApi";

type DeadlineFormProps = {
  editingDeadline: DeadlineInput | null;
  settings: PlannerSettings;
  onSettingsChange: (settings: PlannerSettings) => void;
  onSave: (deadline: DeadlineInput) => void;
  onCancelEdit: () => void;
  onLoadSample: () => void;
  onGenerate: () => void;
  isLoading: boolean;
};

const emptyForm = {
  course: "",
  title: "",
  dueDate: "",
  difficulty: 3,
  estimatedHours: 4,
  priority: "medium" as Priority
};

function makeId(course: string, title: string) {
  const slug = `${course}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slug || "deadline"}-${Date.now()}`;
}

export function DeadlineForm({
  editingDeadline,
  settings,
  onSettingsChange,
  onSave,
  onCancelEdit,
  onLoadSample,
  onGenerate,
  isLoading
}: DeadlineFormProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingDeadline) {
      setForm({
        course: editingDeadline.course,
        title: editingDeadline.title,
        dueDate: editingDeadline.dueDate,
        difficulty: editingDeadline.difficulty,
        estimatedHours: editingDeadline.estimatedHours ?? 4,
        priority: editingDeadline.priority
      });
    }
  }, [editingDeadline]);

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.course.trim() || !form.title.trim() || !form.dueDate) {
      return;
    }

    onSave({
      id: editingDeadline?.id ?? makeId(form.course, form.title),
      course: form.course.trim().toUpperCase(),
      title: form.title.trim(),
      dueDate: form.dueDate,
      difficulty: form.difficulty,
      estimatedHours: Number.isFinite(form.estimatedHours) ? form.estimatedHours : null,
      priority: form.priority
    });

    setForm(emptyForm);
  }

  return (
    <section className="glass-panel rounded-3xl p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-2xl font-bold">Courses & Deadlines</p>
          <p className="mt-1 text-sm text-muted">Add academic tasks, tune weekly capacity, then generate a balanced plan.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-primary"
            onClick={onLoadSample}
            type="button"
          >
            <RotateCcw size={16} />
            Load DAU Sample
          </button>
          <button
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isLoading}
            onClick={onGenerate}
            type="button"
          >
            <CalendarPlus size={16} />
            {isLoading ? "Generating..." : "Generate Plan"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-line bg-white/70 p-4 md:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Semester start</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            onChange={(event) => onSettingsChange({ ...settings, semesterStart: event.target.value })}
            type="date"
            value={settings.semesterStart}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Weeks</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            max={24}
            min={1}
            onChange={(event) => onSettingsChange({ ...settings, weeks: Number(event.target.value) })}
            type="number"
            value={settings.weeks}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Study hours / week</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            min={1}
            onChange={(event) => onSettingsChange({ ...settings, availableHoursPerWeek: Number(event.target.value) })}
            type="number"
            value={settings.availableHoursPerWeek}
          />
        </label>
      </div>

      <form className="grid gap-4 md:grid-cols-6" onSubmit={submitForm}>
        <label className="md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Course</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            onChange={(event) => setForm({ ...form, course: event.target.value })}
            placeholder="CS401"
            required
            value={form.course}
          />
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Title</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Final project"
            required
            value={form.title}
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Due date</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            required
            type="date"
            value={form.dueDate}
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Hours</span>
          <input
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            min={0.5}
            onChange={(event) => setForm({ ...form, estimatedHours: Number(event.target.value) })}
            step={0.5}
            type="number"
            value={form.estimatedHours}
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Difficulty</span>
          <select
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            onChange={(event) => setForm({ ...form, difficulty: Number(event.target.value) })}
            value={form.difficulty}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Priority</span>
          <select
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:focus-ring"
            onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}
            value={form.priority}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <div className="flex items-end gap-3 md:col-span-4">
          <button className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white" type="submit">
            <Save size={16} />
            {editingDeadline ? "Save Changes" : "Add Deadline"}
          </button>
          {editingDeadline ? (
            <button className="h-11 rounded-xl border border-line px-4 text-sm font-semibold text-muted" onClick={onCancelEdit} type="button">
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
