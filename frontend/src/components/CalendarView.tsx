"use client";

import { useState } from "react";
import { AlertTriangle, Bot, ChevronLeft, ChevronRight, FileText, Search, Sparkles } from "lucide-react";

type CalendarEvent = {
  day: number; // Day number in Nov 2024
  title: string;
  course: string;
  start: string;
  end: string;
  location?: string;
  type: "course" | "meeting" | "exam" | "prep" | "focus";
};

const sampleEvents: CalendarEvent[] = [
  { day: 11, course: "Data Structures", title: "Study Block", start: "9:00 AM", end: "10:30 AM", type: "course" },
  { day: 12, course: "Research Group", title: "Weekly Sync", start: "10:00 AM", end: "12:00 PM", location: "Lab 4B", type: "meeting" },
  { day: 13, course: "Data Structures", title: "Study Block", start: "9:00 AM", end: "10:30 AM", type: "course" },
  { day: 13, course: "AI Study Prep", title: "Exam Prep", start: "11:00 AM", end: "12:00 PM", type: "prep" },
  { day: 13, course: "Midterm Exam", title: "Algorithms", start: "1:00 PM", end: "3:00 PM", type: "exam" },
  { day: 14, course: "Focus Block", title: "Independent Study", start: "12:00 PM", end: "1:30 PM", type: "focus" }
];

const eventTones = {
  course: "border-cyan-200 bg-cyan-50/50 text-cyan-900",
  meeting: "border-amber-200 bg-amber-50/50 text-amber-900",
  prep: "border-violet-200 bg-violet-50/50 text-violet-900",
  exam: "border-red-200 bg-red-50/50 text-red-900",
  focus: "border-slate-200 bg-slate-50/50 text-slate-900"
};

export function CalendarView() {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(11); // Start date of current week

  const daysOfWeek = [
    { label: "MON", num: 11 },
    { label: "TUE", num: 12 },
    { label: "WED", num: 13, isToday: true },
    { label: "THU", num: 14 },
    { label: "FRI", num: 15 },
    { label: "SAT", num: 16 },
    { label: "SUN", num: 17 }
  ];

  const hours = [
    "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"
  ];

  // Helper to check if an event is in a specific day and hour slot
  const getEventsForSlot = (dayNum: number, hourStr: string) => {
    return sampleEvents.filter((event) => {
      if (event.day !== dayNum) return false;
      const eventStartHour = event.start.split(":")[0];
      const eventStartAmPm = event.start.split(" ")[1];
      const slotHour = hourStr.split(" ")[0];
      const slotAmPm = hourStr.split(" ")[1];
      return eventStartHour === slotHour && eventStartAmPm === slotAmPm;
    });
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_24rem] animate-fade-in-up">
      {/* Calendar Grid Container */}
      <div className="glass-panel flex flex-col rounded-3xl p-6 overflow-hidden">
        {/* Header Controller */}
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-ink">November 2024</h2>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
              <button className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-700" type="button">
                <ChevronLeft size={16} />
              </button>
              <button className="rounded-lg px-3 py-1 text-xs font-semibold hover:bg-slate-50 text-slate-700" type="button">
                Today
              </button>
              <button className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-700" type="button">
                <ChevronRight size={16} />
              </button>
            </div>
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

        {/* Weekly Timetable Grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[50rem]">
            {/* Days Header */}
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
              {/* Current Time Line (Wed 13, around 10:15 AM) */}
              <div 
                className="absolute left-0 right-0 flex items-center pointer-events-none"
                style={{ top: "155px" }} // Fixed positioning matching 10:15 AM for mockup fidelity
              >
                <div className="w-[5rem] text-right pr-3 text-[10px] font-bold text-red-500 tracking-wider">10:15 AM</div>
                <div className="relative flex-1 h-[2px] bg-red-400">
                  {/* Glowing dot on Wednesday (Wednesday is col index 2 out of 7) */}
                  <div 
                    className="absolute h-3 w-3 rounded-full bg-red-500 border border-white shadow-glow"
                    style={{ left: "calc(5rem + (100% - 5rem) / 7 * 2.5)" }} // Wednesday position
                  />
                </div>
              </div>

              {hours.map((hour) => (
                <div className="grid grid-cols-[5rem_1fr] min-h-[4.5rem] border-b border-line/40 align-top" key={hour}>
                  {/* Time labels */}
                  <span className="pt-2 pr-3 text-right text-xs font-bold text-muted">{hour}</span>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-2 border-l border-line/40 relative">
                    {daysOfWeek.map((day) => {
                      const slotEvents = getEventsForSlot(day.num, hour);
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
                              {event.location ? (
                                <p className="text-[10px] mt-1 font-semibold opacity-70">📍 {event.location}</p>
                              ) : null}
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

      {/* Right Sidebar */}
      <aside className="space-y-6">
        {/* AI Insights Suggestion Card */}
        <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 shadow-soft">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary tracking-wide">AI Insights</p>
              <p className="text-xs text-muted mt-0.5">Recommendations from your schedule</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-4 shadow-soft">
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Suggested Block</span>
            <h3 className="font-bold text-ink mt-1">Review Algorithms Notes</h3>
            <p className="text-xs leading-relaxed text-slate-700 mt-2">
              Based on your upcoming midterm tomorrow, scheduling a 90-minute review session this evening is highly recommended.
            </p>
            <button className="mt-4 w-full rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-glow hover:bg-blue-700 transition" type="button">
              Add to Schedule
            </button>
          </div>
        </section>

        {/* Upcoming Deadlines Widget */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Upcoming Deadlines</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/40 p-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <AlertTriangle size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-red-900">CS401 Project Draft</p>
                <p className="text-[10px] font-semibold text-red-700 mt-0.5">Due in 2 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <FileText size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Lit Review Submission</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-0.5">Due Friday, 5 PM</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mini Month Grid */}
        <section className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-ink">November 2024</span>
            <div className="flex items-center gap-2 text-slate-700">
              <button className="hover:bg-slate-50 p-1 rounded-lg" type="button"><ChevronLeft size={14} /></button>
              <button className="hover:bg-slate-50 p-1 rounded-lg" type="button"><ChevronRight size={14} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mt-2">
            {/* Previous month days */}
            <span className="text-slate-300 py-1">28</span>
            <span className="text-slate-300 py-1">29</span>
            <span className="text-slate-300 py-1">30</span>
            <span className="text-slate-300 py-1">31</span>
            {/* Current month days */}
            <span className="py-1">1</span>
            <span className="py-1">2</span>
            <span className="py-1">3</span>
            <span className="py-1">4</span>
            <span className="py-1">5</span>
            <span className="py-1">6</span>
            <span className="py-1">7</span>
            <span className="py-1">8</span>
            <span className="py-1">9</span>
            <span className="py-1">10</span>
            <span className="py-1">11</span>
            <span className="py-1">12</span>
            {/* Wednesday 13 highlighted */}
            <span className="bg-primary text-white rounded-full font-bold py-1 flex items-center justify-center h-6 w-6 mx-auto">13</span>
            <span className="py-1">14</span>
            <span className="py-1">15</span>
            <span className="py-1">16</span>
            <span className="py-1">17</span>
            <span className="py-1">18</span>
            <span className="py-1">19</span>
            <span className="py-1">20</span>
          </div>
        </section>
      </aside>
    </section>
  );
}
