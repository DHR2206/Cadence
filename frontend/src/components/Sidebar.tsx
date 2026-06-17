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

export type SectionId = "dashboard" | "courses" | "study-plan" | "analytics";

const navItems: Array<{
  id: SectionId | "calendar" | "assistant" | "settings";
  label: string;
  icon: typeof LayoutDashboard;
  dot?: boolean;
  disabled?: boolean;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays, disabled: true },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "study-plan", label: "Study Plan", icon: BookOpenText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "assistant", label: "AI Assistant", icon: Bot, dot: true, disabled: true },
  { id: "settings", label: "Settings", icon: Settings, disabled: true }
];

type SidebarProps = {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
};

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
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
          const active = item.id === activeSection;
          return (
            <button
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "translate-x-1 border-l-4 border-primary bg-blue-50 text-primary"
                  : item.disabled
                    ? "cursor-not-allowed text-slate-400"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
              disabled={item.disabled}
              key={item.label}
              onClick={() => {
                if (!item.disabled) {
                  onSectionChange(item.id as SectionId);
                }
              }}
              type="button"
            >
              <Icon size={19} />
              {item.label}
              {item.dot ? <span className="ml-auto h-2 w-2 rounded-full bg-cyan" /> : null}
            </button>
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
