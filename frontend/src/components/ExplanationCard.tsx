import React from "react";
import { AlertCircle, Flame, ShieldCheck, TrendingUp } from "lucide-react";

export interface ExplanationCardProps {
  course: string;
  title: string;
  priorityScore: number;
  riskScore: number;
  reasoning: string;
}

export function ExplanationCard({
  course,
  title,
  priorityScore,
  riskScore,
  reasoning
}: ExplanationCardProps) {
  // Score styling helpers
  const getRiskColor = (score: number) => {
    if (score >= 75) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 45) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  const getPriorityColor = (score: number) => {
    if (score >= 75) return "from-rose-500 to-red-600";
    if (score >= 45) return "from-blue-500 to-indigo-600";
    return "from-slate-400 to-slate-500";
  };

  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border border-line bg-white/70 p-5 shadow-soft transition hover:shadow-md">
      {/* Top Tag and Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          {course}
        </span>
        <div className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRiskColor(riskScore)}`}>
          {riskScore >= 75 ? (
            <>
              <Flame size={12} /> High Risk ({riskScore}%)
            </>
          ) : riskScore >= 45 ? (
            <>
              <AlertCircle size={12} /> Medium Risk ({riskScore}%)
            </>
          ) : (
            <>
              <ShieldCheck size={12} /> Low Risk ({riskScore}%)
            </>
          )}
        </div>
      </div>

      <h4 className="mt-3 text-base font-bold tracking-tight text-ink">
        {title}
      </h4>

      {/* Score details */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-y border-line py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <TrendingUp size={10} /> Priority Index
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getPriorityColor(priorityScore)}`}
                style={{ width: `${priorityScore}%` }}
              />
            </div>
            <span className="text-sm font-extrabold text-ink">{priorityScore}</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <Flame size={10} /> Workload Risk
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${
                  riskScore >= 75
                    ? "from-red-500 to-rose-600"
                    : riskScore >= 45
                      ? "from-amber-400 to-orange-500"
                      : "from-emerald-400 to-green-500"
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <span className="text-sm font-extrabold text-ink">{riskScore}</span>
          </div>
        </div>
      </div>

      {/* Explainable AI justification */}
      <div className="mt-4 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Justification</p>
        <p className="mt-1 text-xs leading-5 text-slate-700 font-medium">
          {reasoning}
        </p>
      </div>
    </div>
  );
}
