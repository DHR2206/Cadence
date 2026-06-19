import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "blue" | "cyan" | "peach" | "red";
};

const tones = {
  blue: "bg-[#d7eaf0] text-primary",
  cyan: "bg-[#dceff1] text-[#377a86]",
  peach: "bg-[#f4e3d5] text-[#a96b3c]",
  red: "bg-[#f3dcd6] text-[#b85d4f]"
};

export function MetricCard({ label, value, detail, icon: Icon, tone }: MetricCardProps) {
  return (
    <article className="metric-card rounded-2xl p-5 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 cursor-default">
      <div className="mb-8 flex items-start justify-between gap-4">
        <p className="max-w-[9rem] text-xs font-semibold uppercase tracking-[0.18em] text-primary">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-bold text-ink">{value}</p>
        <p className="pb-1 text-sm font-medium text-muted">{detail}</p>
      </div>
    </article>
  );
}
