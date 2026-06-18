import type { SectionId } from "@/components/Sidebar";

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "courses", label: "Courses" },
  { id: "study-plan", label: "Study Plan" },
  { id: "analytics", label: "Analytics" },
  { id: "assistant", label: "AI Assistant" },
  { id: "settings", label: "Settings" }
];

type MobileSectionNavProps = {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
};

export function MobileSectionNav({ activeSection, onSectionChange }: MobileSectionNavProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-2 shadow-soft lg:hidden">
      {sections.map((section) => (
        <button
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            activeSection === section.id ? "bg-primary text-white" : "text-muted"
          }`}
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          type="button"
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
