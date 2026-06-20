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

export type SectionId =
  | "dashboard"
  | "courses"
  | "study-plan"
  | "analytics"
  | "calendar"
  | "assistant"
  | "settings";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "study-plan", label: "Study Plan", icon: BookOpenText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "assistant", label: "AI Assistant", icon: Bot, dot: true },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

type SidebarProps = {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onSignOut: () => void;
  userEmail: string;
  userName: string;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST"
  );
}

export function Sidebar({
  activeSection,
  onSectionChange,
  onSignOut,
  userEmail,
  userName
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-primary/20 bg-primary p-5 text-white shadow-soft lg:flex lg:flex-col">

      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
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
          <p className="text-lg font-bold">Cadence AI</p>
          <p className="text-sm text-white/70">
            Academic Workspace
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onSectionChange("study-plan")}
        className="mb-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary shadow-glow transition hover:-translate-y-0.5 hover:bg-mist"
      >
        <Plus size={18} />
        New Study Session
      </button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition
                ${
                  active
                    ? "translate-x-1 border-l-4 border-white bg-white text-primary shadow-soft"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon size={19} />

              {item.label}

              {item.dot && (
                <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-8 border-t border-white/20 pt-5">

        <a
          href="mailto:your@email.com"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <HelpCircle size={19} />
          Help Center
        </a>

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={19} />
          Logout
        </button>

        <div className="mt-4 flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
            {initials(userName)}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-white">
              {userName}
            </p>

            <p className="truncate text-xs text-white/60">
              {userEmail}
            </p>
          </div>
        </div>

      </div>
    </aside>
  );
}
