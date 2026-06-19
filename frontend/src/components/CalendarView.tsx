"use client";

import { useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult
} from "@hello-pangea/dnd";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type { DeadlineInput, PlannerSettings, StudySession } from "@/lib/plannerApi";

type SessionDraft = Omit<StudySession, "id" | "week" | "day" | "start" | "end" | "hours"> & {
  starts_at: string;
  ends_at: string;
};

type SessionUpdate = Partial<Pick<StudySession, "title" | "type" | "status" | "starts_at" | "ends_at" | "assignmentId">>;

type CalendarViewProps = {
  sessions: StudySession[];
  deadlines: DeadlineInput[];
  settings: PlannerSettings;
  onCreateSession: (session: SessionDraft) => Promise<StudySession>;
  onUpdateSession: (sessionId: string, updates: SessionUpdate) => Promise<StudySession>;
  onDeleteSession: (sessionId: string) => Promise<void>;
};

type CalendarSlot = {
  date: Date;
  hour: number;
};

type FormState = {
  title: string;
  course: string;
  date: string;
  start: string;
  end: string;
  type: "study" | "deep-work";
  status: "scheduled" | "completed" | "skipped";
};

const eventTones = {
  scheduled: "border-cyan-200 bg-cyan-50 text-cyan-950",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-950",
  skipped: "border-slate-200 bg-slate-100 text-slate-700"
};

const statusLabels = {
  scheduled: "Planned",
  completed: "Completed",
  skipped: "Skipped"
};

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const hours = Array.from({ length: 11 }, (_, index) => index + 7);

function getWeekIndexForDate(d: Date, semesterStart: string, weeks: number): number {
  const [sYear, sMonth, sDateNum] = semesterStart.split("-").map(Number);
  const semStart = new Date(sYear, sMonth - 1, sDateNum, 0, 0, 0);
  const diffMs = d.getTime() - semStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(weeks, week));
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseLocalDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function formatDisplayTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display} ${suffix}`;
}

function slotId(prefix: "desktop" | "mobile", date: Date, hour: number) {
  return `${prefix}|${toDateInputValue(date)}|${hour}`;
}

function parseSlotId(id: string): CalendarSlot | null {
  const [, dateValue, hourValue] = id.split("|");
  if (!dateValue || !hourValue) return null;
  return {
    date: parseLocalDateTime(dateValue, "00:00"),
    hour: Number(hourValue)
  };
}

function getSessionStart(session: StudySession, settings: PlannerSettings) {
  if (session.starts_at) return new Date(session.starts_at);
  const { starts_at } = getFallbackSessionDates(session, settings);
  return new Date(starts_at);
}

function getSessionEnd(session: StudySession, settings: PlannerSettings) {
  if (session.ends_at) return new Date(session.ends_at);
  const { ends_at } = getFallbackSessionDates(session, settings);
  return new Date(ends_at);
}

function getFallbackSessionDates(session: StudySession, settings: PlannerSettings) {
  const [year, month, dateNum] = settings.semesterStart.split("-").map(Number);
  const baseDate = new Date(year, month - 1, dateNum, 0, 0, 0);
  const dayOffset = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[session.day] ?? 0;
  const sessionDate = new Date(baseDate);
  sessionDate.setDate(baseDate.getDate() + (session.week - 1) * 7 + dayOffset);
  return {
    starts_at: parseLocalDateTime(toDateInputValue(sessionDate), session.start).toISOString(),
    ends_at: parseLocalDateTime(toDateInputValue(sessionDate), session.end).toISOString()
  };
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function defaultFormState(date: Date): FormState {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(10, 0, 0, 0);
  return {
    title: "",
    course: "General",
    date: toDateInputValue(start),
    start: toTimeInputValue(start),
    end: toTimeInputValue(end),
    type: "study",
    status: "scheduled"
  };
}

function formStateFromSession(session: StudySession, settings: PlannerSettings): FormState {
  const start = getSessionStart(session, settings);
  const end = getSessionEnd(session, settings);
  return {
    title: session.title,
    course: session.course,
    date: toDateInputValue(start),
    start: toTimeInputValue(start),
    end: toTimeInputValue(end),
    type: session.type,
    status: session.status || "scheduled"
  };
}

export function CalendarView({
  sessions,
  deadlines,
  settings,
  onCreateSession,
  onDeleteSession,
  onUpdateSession
}: CalendarViewProps) {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const initialWeekIndex = useMemo(() => getWeekIndexForDate(new Date(), settings.semesterStart, settings.weeks), [settings]);
  const [weekIndex, setWeekIndex] = useState(initialWeekIndex);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [formState, setFormState] = useState<FormState>(() => defaultFormState(new Date()));
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = useMemo(() => {
    const [sYear, sMonth, sDateNum] = settings.semesterStart.split("-").map(Number);
    const semStart = new Date(sYear, sMonth - 1, sDateNum, 0, 0, 0);
    const mondayDate = new Date(semStart);
    mondayDate.setDate(semStart.getDate() + (weekIndex - 1) * 7);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      return {
        label: dayLabels[index],
        date,
        num: date.getDate(),
        isToday: sameDay(date, new Date()),
        isSelected: sameDay(date, selectedDate)
      };
    });
  }, [selectedDate, settings, weekIndex]);

  const visibleDays = view === "day" ? daysOfWeek.filter((day) => sameDay(day.date, selectedDate)) : daysOfWeek;
  const mondayDate = daysOfWeek[0].date;

  const headerTitle = useMemo(() => {
    const sundayDate = daysOfWeek[6].date;
    const startMonth = mondayDate.toLocaleString("default", { month: "long" });
    const endMonth = sundayDate.toLocaleString("default", { month: "long" });
    if (startMonth === endMonth) return `${startMonth} ${mondayDate.getFullYear()}`;
    return `${startMonth} - ${endMonth} ${sundayDate.getFullYear()}`;
  }, [daysOfWeek, mondayDate]);

  const sessionsBySlot = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    sessions.forEach((session) => {
      const start = getSessionStart(session, settings);
      const key = `${toDateInputValue(start)}|${start.getHours()}`;
      const current = map.get(key) || [];
      current.push(session);
      map.set(key, current);
    });

    map.forEach((slotSessions) => {
      slotSessions.sort((a, b) => getSessionStart(a, settings).getTime() - getSessionStart(b, settings).getTime());
    });

    return map;
  }, [sessions, settings]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlines
      .filter((deadline) => new Date(`${deadline.dueDate}T00:00:00`) >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [deadlines]);

  const miniMonthData = useMemo(() => {
    const year = mondayDate.getFullYear();
    const month = mondayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    const cells: Array<{ date: Date; num: number; isCurrentMonth: boolean; isToday: boolean; isCurrentWeek: boolean }> = [];

    for (let index = firstDayIndex - 1; index >= 0; index -= 1) {
      const date = new Date(year, month - 1, prevTotalDays - index);
      cells.push({ date, num: date.getDate(), isCurrentMonth: false, isToday: false, isCurrentWeek: false });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      cells.push({
        date,
        num: day,
        isCurrentMonth: true,
        isToday: sameDay(date, new Date()),
        isCurrentWeek: daysOfWeek.some((weekDay) => sameDay(weekDay.date, date))
      });
    }

    while (cells.length < 42) {
      const date = new Date(year, month + 1, cells.length - totalDays - firstDayIndex + 1);
      cells.push({ date, num: date.getDate(), isCurrentMonth: false, isToday: false, isCurrentWeek: false });
    }

    return {
      title: mondayDate.toLocaleString("default", { month: "long", year: "numeric" }),
      cells
    };
  }, [daysOfWeek, mondayDate]);

  const selectSession = (session: StudySession) => {
    setEditingSession(session);
    setFormState(formStateFromSession(session, settings));
  };

  const startNewSession = (date = selectedDate, hour = 9) => {
    const nextDate = new Date(date);
    nextDate.setHours(hour, 0, 0, 0);
    const end = new Date(nextDate);
    end.setHours(hour + 1, 0, 0, 0);
    setEditingSession(null);
    setFormState({
      title: "",
      course: "General",
      date: toDateInputValue(nextDate),
      start: toTimeInputValue(nextDate),
      end: toTimeInputValue(end),
      type: "study",
      status: "scheduled"
    });
  };

  const handleSubmit = async () => {
    const startsAt = parseLocalDateTime(formState.date, formState.start);
    const endsAt = parseLocalDateTime(formState.date, formState.end);
    if (!formState.title.trim() || endsAt <= startsAt) return;

    setIsSaving(true);
    try {
      if (editingSession?.id) {
        const updated = await onUpdateSession(editingSession.id, {
          title: formState.title.trim(),
          type: formState.type,
          status: formState.status,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString()
        });
        setEditingSession(updated);
      } else {
        const created = await onCreateSession({
          title: formState.title.trim(),
          course: formState.course.trim() || "General",
          type: formState.type,
          status: formState.status,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString()
        });
        setEditingSession(created);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSession?.id) return;
    setIsSaving(true);
    try {
      await onDeleteSession(editingSession.id);
      setEditingSession(null);
      setFormState(defaultFormState(selectedDate));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sessionId = result.draggableId.split("|").pop();
    const session = sessions.find((item) => item.id === sessionId);
    const slot = parseSlotId(result.destination.droppableId);
    if (!session?.id || !slot) return;

    const currentStart = getSessionStart(session, settings);
    const currentEnd = getSessionEnd(session, settings);
    const duration = currentEnd.getTime() - currentStart.getTime();
    const nextStart = new Date(slot.date);
    nextStart.setHours(slot.hour, currentStart.getMinutes(), 0, 0);
    const nextEnd = new Date(nextStart.getTime() + duration);
    await onUpdateSession(session.id, {
      starts_at: nextStart.toISOString(),
      ends_at: nextEnd.toISOString()
    });
  };

  const renderSessionCard = (session: StudySession, index: number, prefix: "desktop" | "mobile") => {
    const start = getSessionStart(session, settings);
    const end = getSessionEnd(session, settings);
    const status = session.status || "scheduled";
    const draggableId = `${prefix}|${session.id || `${session.title}-${start.toISOString()}`}`;

    return (
      <Draggable draggableId={draggableId} index={index} isDragDisabled={!session.id} key={draggableId}>
        {(provided, snapshot) => (
          <button
            className={`mb-1 w-full rounded-lg border p-2 text-left shadow-soft transition hover:-translate-y-0.5 ${eventTones[status]} ${
              snapshot.isDragging ? "rotate-1 shadow-glow" : ""
            }`}
            onClick={() => selectSession(session)}
            ref={provided.innerRef}
            type="button"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div className="flex items-start gap-2">
              <GripVertical className="mt-0.5 shrink-0 opacity-50" size={14} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold uppercase tracking-wide opacity-70">{session.course}</p>
                <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-tight">{session.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold opacity-75">
                  <Clock3 size={11} /> {formatDisplayTime(start)} - {formatDisplayTime(end)}
                </p>
              </div>
              {status === "completed" ? <CheckCircle2 className="shrink-0 text-emerald-600" size={14} /> : null}
            </div>
          </button>
        )}
      </Draggable>
    );
  };

  const renderSlot = (day: { date: Date }, hour: number, prefix: "desktop" | "mobile") => {
    const key = `${toDateInputValue(day.date)}|${hour}`;
    const slotSessions = sessionsBySlot.get(key) || [];
    return (
      <Droppable droppableId={slotId(prefix, day.date, hour)} key={`${prefix}-${key}`}>
        {(provided, snapshot) => (
          <div
            className={`min-h-[5rem] rounded-xl border border-dashed p-1 transition ${
              snapshot.isDraggingOver ? "border-primary bg-blue-50" : "border-transparent"
            }`}
            onDoubleClick={() => startNewSession(day.date, hour)}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {slotSessions.map((session, index) => renderSessionCard(session, index, prefix))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
        <div className="glass-panel min-w-0 rounded-2xl p-4 sm:p-6">
          <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-ink">{headerTitle}</h2>
              <p className="mt-1 text-xs font-semibold text-muted">Week {weekIndex} / {settings.weeks}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-line bg-white p-1">
                <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40" disabled={weekIndex <= 1} onClick={() => setWeekIndex((week) => week - 1)} type="button">
                  <ChevronLeft size={16} />
                </button>
                <button className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setWeekIndex(initialWeekIndex)} type="button">
                  Today
                </button>
                <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40" disabled={weekIndex >= settings.weeks} onClick={() => setWeekIndex((week) => week + 1)} type="button">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex rounded-xl border border-line bg-white p-1">
                {(["day", "week", "month"] as const).map((value) => (
                  <button
                    className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                      view === value ? "bg-slate-100 text-ink shadow-soft" : "text-slate-500 hover:bg-slate-50"
                    }`}
                    key={value}
                    onClick={() => setView(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>

              <button className="flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-glow" onClick={() => startNewSession()} type="button">
                <Plus size={16} /> Session
              </button>
            </div>
          </header>

          <div className="mb-4 grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <button
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  day.isSelected ? "border-primary bg-blue-50 text-primary" : "border-line bg-white text-slate-700 hover:bg-slate-50"
                }`}
                key={day.label}
                onClick={() => {
                  setSelectedDate(day.date);
                  setView("day");
                }}
                type="button"
              >
                <span className="block text-[10px] font-bold">{day.label}</span>
                <span className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${day.isToday ? "bg-primary text-white" : ""}`}>
                  {day.num}
                </span>
              </button>
            ))}
          </div>

          {view === "month" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => {
                const start = getSessionStart(session, settings);
                return (
                  <button
                    className={`rounded-xl border p-3 text-left shadow-soft ${eventTones[session.status || "scheduled"]}`}
                    key={session.id || `${session.title}-${start.toISOString()}`}
                    onClick={() => selectSession(session)}
                    type="button"
                  >
                    <p className="text-[10px] font-bold uppercase opacity-70">{start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</p>
                    <p className="mt-1 text-sm font-bold">{session.title}</p>
                    <p className="mt-1 text-xs font-semibold opacity-75">{session.course} • {statusLabels[session.status || "scheduled"]}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <div className="min-w-[52rem]">
                  <div className={`grid border-b border-line pb-3 text-center ${view === "day" ? "grid-cols-[5rem_1fr]" : "grid-cols-[5rem_repeat(7,minmax(0,1fr))]"}`}>
                    <div />
                    {visibleDays.map((day) => (
                      <div key={day.label}>
                        <span className="text-xs font-bold text-muted">{day.label}</span>
                        <span className={`mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${day.isToday ? "bg-primary text-white shadow-glow" : "text-ink"}`}>
                          {day.num}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    {hours.map((hour) => (
                      <div className={`grid min-h-[5rem] border-b border-line/50 ${view === "day" ? "grid-cols-[5rem_1fr]" : "grid-cols-[5rem_repeat(7,minmax(0,1fr))]"}`} key={hour}>
                        <span className="pr-3 pt-3 text-right text-xs font-bold text-muted">{formatHourLabel(hour)}</span>
                        {visibleDays.map((day) => renderSlot(day, hour, "desktop"))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:hidden">
                {visibleDays.map((day) => (
                  <section className="rounded-2xl border border-line bg-white p-3" key={day.label}>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-muted">{day.label}</p>
                        <p className="text-lg font-bold text-ink">{day.date.toLocaleDateString([], { month: "short", day: "numeric" })}</p>
                      </div>
                      <button className="rounded-full border border-line p-2 text-slate-700" onClick={() => startNewSession(day.date, 9)} type="button">
                        <CalendarPlus size={16} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {hours.map((hour) => (
                        <div className="grid grid-cols-[3.5rem_1fr] gap-2" key={hour}>
                          <span className="pt-3 text-xs font-bold text-muted">{formatHourLabel(hour)}</span>
                          {renderSlot(day, hour, "mobile")}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </DragDropContext>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{editingSession ? "Edit Session" : "Create Session"}</p>
              <p className="mt-1 text-sm font-bold text-ink">{statusLabels[formState.status]}</p>
            </div>
            {editingSession ? (
              <button className="rounded-full border border-line p-2 text-slate-600" onClick={() => startNewSession()} type="button">
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted">
              Title
              <input
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                placeholder="Study Session"
                value={formState.title}
              />
            </label>
            <label className="block text-xs font-bold text-muted">
              Course
              <input
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                disabled={Boolean(editingSession?.id)}
                onChange={(event) => setFormState((current) => ({ ...current, course: event.target.value }))}
                value={formState.course}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-muted">
                Date
                <input
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                  onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
                  type="date"
                  value={formState.date}
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                  onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as FormState["status"] }))}
                  value={formState.status}
                >
                  <option value="scheduled">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-muted">
                Start
                <input
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                  onChange={(event) => setFormState((current) => ({ ...current, start: event.target.value }))}
                  type="time"
                  value={formState.start}
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                End
                <input
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                  onChange={(event) => setFormState((current) => ({ ...current, end: event.target.value }))}
                  type="time"
                  value={formState.end}
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-muted">
              Type
              <select
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-primary"
                onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value as FormState["type"] }))}
                value={formState.type}
              >
                <option value="study">Study</option>
                <option value="deep-work">Deep Work</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-glow disabled:opacity-60"
              disabled={isSaving || !formState.title.trim()}
              onClick={() => void handleSubmit()}
              type="button"
            >
              <Save size={16} /> {isSaving ? "Saving" : "Save"}
            </button>
            {editingSession?.id ? (
              <button className="rounded-xl border border-red-200 bg-red-50 px-3 text-red-700 disabled:opacity-60" disabled={isSaving} onClick={() => void handleDelete()} type="button">
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-soft">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary tracking-wide">AI Insights</p>
              <p className="text-xs text-muted mt-0.5 font-semibold">Schedule balance</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 shadow-soft">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{sessions.length} sessions</span>
            <h3 className="mt-1 font-bold text-ink">Study cadence</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              {sessions.filter((session) => session.status === "completed").length} completed, {sessions.filter((session) => session.status === "skipped").length} skipped.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Upcoming Deadlines</p>
          <div className="mt-4 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs leading-5 text-muted">No upcoming deadlines found.</p>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3" key={deadline.id}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
                    {new Date(`${deadline.dueDate}T00:00:00`) <= new Date() ? <AlertTriangle size={15} /> : <FileText size={15} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink">{deadline.course} • {deadline.title}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{deadline.dueDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-ink">{miniMonthData.title}</span>
            <Pencil size={14} className="text-slate-500" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
            {miniMonthData.cells.map((cell) => (
              <button
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full font-bold transition ${
                  !cell.isCurrentMonth
                    ? "text-slate-300"
                    : cell.isToday
                      ? "bg-red-500 text-white shadow-glow"
                      : cell.isCurrentWeek
                        ? "bg-primary text-white shadow-soft"
                        : "text-slate-800 hover:bg-slate-50"
                }`}
                key={cell.date.toISOString()}
                onClick={() => {
                  setSelectedDate(cell.date);
                  setWeekIndex(getWeekIndexForDate(cell.date, settings.semesterStart, settings.weeks));
                  setView("day");
                }}
                type="button"
              >
                {cell.num}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
