import { Pencil, Trash2 } from "lucide-react";
import type { DeadlineInput } from "@/lib/plannerApi";

type DeadlineListProps = {
  deadlines: DeadlineInput[];
  onEdit: (deadline: DeadlineInput) => void;
  onDelete: (id: string) => void;
};

export function DeadlineList({ deadlines, onEdit, onDelete }: DeadlineListProps) {
  if (deadlines.length === 0) {
    return (
      <section className="glass-panel rounded-3xl p-6">
        <p className="text-xl font-bold">Deadline List</p>
        <p className="mt-4 rounded-2xl border border-dashed border-line bg-white/70 p-5 text-sm leading-6 text-muted">
          No deadlines added yet. Add one manually or load the DAU sample data to see collision forecasting in action.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xl font-bold">Deadline List</p>
          <p className="mt-1 text-sm text-muted">{deadlines.length} task{deadlines.length === 1 ? "" : "s"} ready for planning.</p>
        </div>
      </div>
      <div className="space-y-3">
        {deadlines.map((deadline) => (
          <article className="rounded-2xl border border-line bg-white/75 p-4" key={deadline.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-primary">{deadline.course}</span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                    {deadline.priority}
                  </span>
                  <span className="text-xs font-semibold text-muted">Difficulty {deadline.difficulty}/5</span>
                </div>
                <p className="mt-3 font-bold">{deadline.title}</p>
                <p className="mt-1 text-sm text-muted">
                  Due {new Date(deadline.dueDate).toLocaleDateString()} · {deadline.estimatedHours ?? "Auto"}h estimated
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-primary"
                  onClick={() => onEdit(deadline)}
                  type="button"
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  className="flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700"
                  onClick={() => onDelete(deadline.id)}
                  type="button"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
