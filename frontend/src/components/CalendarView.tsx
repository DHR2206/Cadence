"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, Search, Sparkles } from "lucide-react";
import type { StudySession, DeadlineInput, PlannerSettings } from "@/lib/plannerApi";

type CalendarViewProps = {
  sessions: StudySession[];
  deadlines: DeadlineInput[];
  settings: PlannerSettings;
};

const eventTones = {
  course: "border-cyan-200 bg-cyan-50/50 text-cyan-900",
  meeting: "border-amber-200 bg-amber-50/50 text-amber-900",
  prep: "border-violet-200 bg-violet-50/50 text-violet-900",
  exam: "border-red-200 bg-red-50/50 text-red-900",
  focus: "border-slate-200 bg-slate-50/50 text-slate-900"
};

// Helper to determine week index relative to semester start date
function getWeekIndexForDate(d: Date, semesterStart: string, weeks: number): number {
  const [sYear, sMonth, sDateNum] = semesterStart.split("-").map(Number);
  const semStart = new Date(sYear, sMonth - 1, sDateNum, 0, 0, 0);
  const diffMs = d.getTime() - semStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(weeks, week));
}

export function CalendarView({ sessions, deadlines, settings }: CalendarViewProps) {
  const [view, setView] = useState<"day" | "week" | "month">("week");

  // Determine current week index in the semester
  const initialWeekIndex = useMemo(() => {
    return getWeekIndexForDate(new Date(), settings.semesterStart, settings.weeks);
  }, [settings]);

  const [weekIndex, setWeekIndex] = useState(initialWeekIndex);

  // Compute the dates for the currently selected week
  const daysOfWeek = useMemo(() => {
    const [sYear, sMonth, sDateNum] = settings.semesterStart.split("-").map(Number);
    const semStart = new Date(sYear, sMonth - 1, sDateNum, 0, 0, 0);

    const mondayDate = new Date(semStart);
    mondayDate.setDate(semStart.getDate() + (weekIndex - 1) * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();
      return {
        label: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i],
        num: date.getDate(),
        date,
        isToday
      };
    });
  }, [weekIndex, settings]);

  const mondayDate = daysOfWeek[0].date;

  // Header Title (e.g. "June 2026" or "June - July 2026")
  const headerTitle = useMemo(() => {
    const sundayDate = daysOfWeek[6].date;
    const startMonth = mondayDate.toLocaleString("default", { month: "long" });
    const startYear = mondayDate.getFullYear();
    const endMonth = sundayDate.toLocaleString("default", { month: "long" });
    const endYear = sundayDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startYear}`;
    }
    if (startYear === endYear) {
      return `${startMonth} – ${endMonth} ${startYear}`;
    }
    return `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
  }, [daysOfWeek, mondayDate]);

  const hours = [
    "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"
  ];

  // Helper to format Date into slot hour string
  const formatHour = (date: Date): string => {
    let h = date.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h} ${ampm}`;
  };

  // Filter study sessions and assignments matching day and hour
  const getEventsForSlot = (dayDate: Date, hourStr: string) => {
    // 1. Matched study sessions
    const slotSessions = sessions.filter((session) => {
      if (session.starts_at) {
        const sessionStart = new Date(session.starts_at);
        const isSameDay =
          sessionStart.getFullYear() === dayDate.getFullYear() &&
          sessionStart.getMonth() === dayDate.getMonth() &&
          sessionStart.getDate() === dayDate.getDate();

        if (!isSameDay) return false;

        return formatHour(sessionStart) === hourStr;
      }

      // Fallback for unsaved generated plans
      const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayLabel = daysShort[dayDate.getDay()];
      if (session.week !== weekIndex || session.day !== dayLabel) {
        return false;
      }

      const [startHourNum] = session.start.split(":").map(Number);
      const startAmPm = startHourNum >= 12 ? "PM" : "AM";
      const displayHour = startHourNum % 12 || 12;
      return `${displayHour} ${startAmPm}` === hourStr;
    });

    const mappedSessions = slotSessions.map((session) => {
      let durationStr = "";
      if (session.starts_at && session.ends_at) {
        const start = new Date(session.starts_at);
        const end = new Date(session.ends_at);
        const formatTime = (d: Date) => d.getHours() % 12 || 12 + ":" + String(d.getMinutes()).padStart(2, "0") + " " + (d.getHours() >= 12 ? "PM" : "AM");
        durationStr = `${formatTime(start)} - ${formatTime(end)}`;
      } else {
        durationStr = `${session.start} - ${session.end}`;
      }

      return {
        course: session.course,
        title: session.title,
        duration: durationStr,
        type: session.type === "deep-work" ? ("focus" as const) : ("prep" as const)
      };
    });

    // 2. Deadlines on this day
    const dayDeadlines = deadlines.filter((d) => {
      const deadlineDate = new Date(d.dueDate + "T00:00:00");
      return (
        deadlineDate.getFullYear() === dayDate.getFullYear() &&
        deadlineDate.getMonth() === dayDate.getMonth() &&
        deadlineDate.getDate() === dayDate.getDate()
      );
    });

    // Show deadlines in 9 AM slot or 4 PM slot depending on convenience
    const mappedDeadlines = (hourStr === "9 AM" ? dayDeadlines : []).map((d) => ({
      course: d.course,
      title: `🚨 DUE: ${d.title}`,
      duration: "Due Today",
      type: "exam" as const
    }));

    return [...mappedSessions, ...mappedDeadlines];
  };

  // Dynamic current time indicator positions
  const timeIndicator = useMemo(() => {
    const today = new Date();
    const colIndex = daysOfWeek.findIndex((day) => day.date.toDateString() === today.toDateString());
    if (colIndex === -1) return null;

    const hour = today.getHours();
    const min = today.getMinutes();
    if (hour < 8 || hour >= 17) return null; // Active calendar displays 8 AM - 5 PM

    const offsetHours = hour + min / 60 - 8;
    const topPx = offsetHours * 72; // Each 1-hour row has 4.5rem height = 72px

    const formatTime12 = (h: number, m: number) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      const displayM = m.toString().padStart(2, "0");
      return `${displayH}:${displayM} ${ampm}`;
    };

    return {
      top: `${topPx}px`,
      timeStr: formatTime12(hour, min),
      leftPercent: `calc(5rem + (100% - 5rem) / 7 * ${colIndex + 0.5})`
    };
  }, [daysOfWeek]);

  // Sidebar dynamic upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlines
      .filter((d) => new Date(d.dueDate) >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
  }, [deadlines]);

  const getDaysRemainingLabel = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr + "T00:00:00");
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 0) return "Overdue";
    return `Due in ${diffDays} days`;
  };

  // Dynamic Suggestion Insight
  const suggestion = useMemo(() => {
    if (upcomingDeadlines.length === 0) {
      return {
        title: "Maintain Cadence",
        description: "Add deadlines and balance your workload to generate dynamic AI calendar tips.",
        course: "Cadence AI"
      };
    }
    const nextDl = upcomingDeadlines[0];
    return {
      title: `Prepare: ${nextDl.title}`,
      description: `You have ${nextDl.title} for ${nextDl.course} due. A focus block is scheduled in your study plan.`,
      course: nextDl.course
    };
  }, [upcomingDeadlines]);

  // Mini Month Calendar Grid
  const miniMonthData = useMemo(() => {
    const year = mondayDate.getFullYear();
    const month = mondayDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0, Sun = 6

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const cells: Array<{ num: number; isCurrentMonth: boolean; isToday: boolean; isCurrentWeek: boolean }> = [];

    // Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        num: prevTotalDays - i,
        isCurrentMonth: false,
        isToday: false,
        isCurrentWeek: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const cellDate = new Date(year, month, i);
      const isToday = cellDate.toDateString() === new Date().toDateString();
      const isCurrentWeek = daysOfWeek.some((d) => d.date.toDateString() === cellDate.toDateString());

      cells.push({
        num: i,
        isCurrentMonth: true,
        isToday,
        isCurrentWeek
      });
    }

    // Pad end of grid
    const totalCells = cells.length > 35 ? 42 : 35;
    const nextDaysNeeded = totalCells - cells.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      cells.push({
        num: i,
        isCurrentMonth: false,
        isToday: false,
        isCurrentWeek: false
      });
    }

    return {
      title: mondayDate.toLocaleString("default", { month: "long", year: "numeric" }),
      cells
    };
  }, [mondayDate, daysOfWeek]);

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_24rem] animate-fade-in-up">
      {/* Calendar Timetable */}
      <div className="glass-panel flex flex-col rounded-3xl p-6 overflow-hidden">
        {/* Navigation Controls */}
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-ink">{headerTitle}</h2>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
              <button
                className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-700 disabled:opacity-40"
                disabled={weekIndex <= 1}
                onClick={() => setWeekIndex((w) => w - 1)}
                type="button"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="rounded-lg px-3 py-1 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                onClick={() => setWeekIndex(initialWeekIndex)}
                type="button"
              >
                Today
              </button>
              <button
                className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-700 disabled:opacity-40"
                disabled={weekIndex >= settings.weeks}
                onClick={() => setWeekIndex((w) => w + 1)}
                type="button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="text-xs font-bold text-muted bg-slate-100 rounded-lg px-2.5 py-1">
              Week {weekIndex} / {settings.weeks}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-line bg-white p-1">
              {(["day", "week", "month"] as const).map((v) => (
                <button
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition ${
                    view === v
                      ? "bg-slate-100 text-ink shadow-soft"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                  key={v}
                  onClick={() => setView(v)}
                  type="button"
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white hover:bg-slate-50 text-slate-700 shadow-soft" type="button">
              <Search size={16} />
            </button>
          </div>
        </header>

        {/* Calendar Timetable Area */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[50rem]">
            {/* Days Column Headers */}
            <div className="grid grid-cols-[5rem_1fr] border-b border-line pb-4 text-center">
              <div />
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.num} className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-muted tracking-wide">{day.label}</span>
                    <span
                      className={`mt-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        day.isToday
                          ? "bg-primary text-white shadow-glow"
                          : "text-ink"
                      }`}
                    >
                      {day.num}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Grid Rows */}
            <div className="relative mt-4">
              {/* Dynamic Current Time Line */}
              {timeIndicator ? (
                <div 
                  className="absolute left-0 right-0 flex items-center pointer-events-none"
                  style={{ top: timeIndicator.top, zIndex: 20 }}
                >
                  <div className="w-[5rem] text-right pr-3 text-[10px] font-bold text-red-500 tracking-wider">
                    {timeIndicator.timeStr}
                  </div>
                  <div className="relative flex-1 h-[2px] bg-red-400">
                    <div 
                      className="absolute h-3 w-3 rounded-full bg-red-500 border border-white shadow-glow -translate-y-[5px]"
                      style={{ left: timeIndicator.leftPercent }}
                    />
                  </div>
                </div>
              ) : null}

              {hours.map((hour) => (
                <div className="grid grid-cols-[5rem_1fr] min-h-[4.5rem] border-b border-line/40 align-top" key={hour}>
                  <span className="pt-2 pr-3 text-right text-xs font-bold text-muted">{hour}</span>

                  <div className="grid grid-cols-7 gap-2 border-l border-line/40 relative">
                    {daysOfWeek.map((day) => {
                      const slotEvents = getEventsForSlot(day.date, hour);
                      return (
                        <div className="relative p-1 h-full min-h-[4.5rem]" key={day.num}>
                          {slotEvents.map((event, index) => (
                            <div
                              className={`absolute inset-x-1 top-1 rounded-xl border p-2 text-left shadow-soft hover:scale-[1.02] transition-all duration-300 ${eventTones[event.type]}`}
                              key={index}
                              style={{ minHeight: "3.5rem", zIndex: 10 }}
                            >
                              <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">{event.course}</p>
                              <p className="text-xs font-bold mt-0.5 leading-tight">{event.title}</p>
                              <p className="text-[9px] font-semibold mt-1 opacity-70">🕒 {event.duration}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Widgets */}
      <aside className="space-y-6">
        {/* Dynamic AI Insights */}
        <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 shadow-soft">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary tracking-wide">AI Insights</p>
              <p className="text-xs text-muted mt-0.5 font-semibold">Smart schedule assistant</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-4 shadow-soft">
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{suggestion.course}</span>
            <h3 className="font-bold text-ink mt-1">{suggestion.title}</h3>
            <p className="text-xs leading-relaxed text-slate-700 mt-2">
              {suggestion.description}
            </p>
          </div>
        </section>

        {/* Dynamic Supabase Deadlines Widget */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Upcoming Deadlines</p>
          <div className="mt-4 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-muted leading-5">No upcoming deadlines found. Add them in the Courses tab.</p>
            ) : (
              upcomingDeadlines.map((d) => {
                const daysRemaining = getDaysRemainingLabel(d.dueDate);
                const isUrgent = daysRemaining.includes("today") || daysRemaining.includes("tomorrow");
                return (
                  <div
                    key={d.id}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                      isUrgent
                        ? "border-red-100 bg-red-50/40 text-red-900"
                        : "border-slate-100 bg-slate-50/40 text-slate-900"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUrgent ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      {isUrgent ? <AlertTriangle size={15} /> : <FileText size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{d.course} • {d.title}</p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${isUrgent ? "text-red-700" : "text-slate-500"}`}>
                        {daysRemaining} ({d.dueDate})
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Mini Month Grid */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-ink">{miniMonthData.title}</span>
            <div className="flex items-center gap-2 text-slate-700">
              <button
                className="hover:bg-slate-50 p-1 rounded-lg disabled:opacity-40"
                disabled={weekIndex <= 1}
                onClick={() => setWeekIndex((w) => w - 1)}
                type="button"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="hover:bg-slate-50 p-1 rounded-lg disabled:opacity-40"
                disabled={weekIndex >= settings.weeks}
                onClick={() => setWeekIndex((w) => w + 1)}
                type="button"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mt-2">
            {miniMonthData.cells.map((cell, idx) => (
              <span
                key={idx}
                className={`py-1 text-center flex items-center justify-center h-6 w-6 mx-auto rounded-full font-bold transition-all ${
                  !cell.isCurrentMonth
                    ? "text-slate-300"
                    : cell.isToday
                      ? "bg-red-500 text-white shadow-glow"
                      : cell.isCurrentWeek
                        ? "bg-primary text-white shadow-soft"
                        : "text-slate-800"
                }`}
              >
                {cell.num}
              </span>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
