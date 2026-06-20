// import {
//   BarChart3,
//   Bot,
//   CalendarDays,
//   GraduationCap,
//   HelpCircle,
//   LayoutDashboard,
//   LogOut,
//   BookOpenText,
//   Plus,
//   Settings,
//   Sparkles
// } from "lucide-react";
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
  Settings
} from "lucide-react";
import Image from "next/image";

export type SectionId = "dashboard" | "courses" | "study-plan" | "analytics" | "calendar" | "assistant" | "settings";

const navItems: Array<{
  id: SectionId;
  label: string;
  icon: typeof LayoutDashboard;
  dot?: boolean;
  disabled?: boolean;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "study-plan", label: "Study Plan", icon: BookOpenText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "assistant", label: "AI Assistant", icon: Bot, dot: true },
  { id: "settings", label: "Settings", icon: Settings }
];

type SidebarProps = {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onSignOut: () => void;
  userEmail: string;
  userName: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";
}

export function Sidebar({ activeSection, onSectionChange, onSignOut, userEmail, userName }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-primary/20 bg-primary p-5 text-white shadow-soft lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white shadow-glow ring-1 ring-white/20">
          <Sparkles size={20} />
        </div> */}
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-glow">
          <Image
            src="/logo.jpg"
            alt="Cadence logo"
            width={48}
            height={48}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <div>
          <p className="text-lg font-bold text-white">Cadence AI</p>
          <p className="text-sm text-white/65">Academic Workspace</p>
        </div>
      </div>

      <button className="mb-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary shadow-glow transition hover:-translate-y-0.5 hover:bg-mist">
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
                  ? "translate-x-1 border-l-4 border-white bg-white text-primary shadow-soft"
                  : item.disabled
                    ? "cursor-not-allowed text-white/35"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
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

      <div className="mt-8 border-t border-white/20 pt-5">
        <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white" href="mailto:support@example.com">
          <HelpCircle size={19} />
          Help Center
        </a>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
          onClick={onSignOut}
          type="button"
        >
          <LogOut size={19} />
          Logout
        </button>
        <div className="mt-4 flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
            {initials(userName)}
          </div>
          <div>
            <p className="font-semibold text-white">{userName}</p>
            <p className="max-w-40 truncate text-xs text-white/60">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
