import {
  BarChart3,
  Bot,
  CalendarDays,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  BookOpenText,
  Plus,
  Settings,
  Sparkles
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Calendar", icon: CalendarDays },
  { label: "Courses", icon: GraduationCap },
  { label: "Study Plan", icon: BookOpenText },
  { label: "Analytics", icon: BarChart3 },
  { label: "AI Assistant", icon: Bot, dot: true },
  { label: "Settings", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-line/70 bg-white/72 p-5 shadow-soft backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-lg font-bold text-primary">Cadence AI</p>
          <p className="text-sm text-muted">Academic Workspace</p>
        </div>
      </div>

      <button className="mb-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-blue-700">
        <Plus size={18} />
        New Study Session
      </button>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                item.active
                  ? "translate-x-1 border-l-4 border-primary bg-blue-50 text-primary"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
              href="#"
              key={item.label}
            >
              <Icon size={19} />
              {item.label}
              {item.dot ? <span className="ml-auto h-2 w-2 rounded-full bg-cyan" /> : null}
            </a>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-line pt-5">
        <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100" href="#">
          <HelpCircle size={19} />
          Help Center
        </a>
        <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100" href="#">
          <LogOut size={19} />
          Logout
        </a>
        <div className="mt-4 flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-bold text-white">
            DR
          </div>
          <div>
            <p className="font-semibold">Daksh Rathod</p>
            <p className="text-xs text-muted">AI/ML and Backend</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
