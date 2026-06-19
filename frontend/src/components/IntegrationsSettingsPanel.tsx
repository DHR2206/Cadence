"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, GraduationCap, RefreshCw, XCircle } from "lucide-react";
import { loadIntegrationStatusesAction, triggerSyncAction } from "@/app/actions/ai";

type GoogleProvider = "google_classroom" | "google_calendar";

type IntegrationStatusRow = {
  provider: "google_classroom" | "google_calendar" | "moodle";
  status: "connected" | "disconnected";
  last_synced_at: string | null;
  updated_at: string;
};

type IntegrationCard = {
  provider: GoogleProvider;
  title: string;
  connectLabel: string;
  icon: typeof GraduationCap;
  accentClass: string;
};

const googleCards: IntegrationCard[] = [
  {
    provider: "google_classroom",
    title: "Google Classroom",
    connectLabel: "Connect Google Classroom",
    icon: GraduationCap,
    accentClass: "bg-emerald-100 text-emerald-700"
  },
  {
    provider: "google_calendar",
    title: "Google Calendar",
    connectLabel: "Connect Google Calendar",
    icon: Calendar,
    accentClass: "bg-blue-100 text-blue-700"
  }
];

function formatTimestamp(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function IntegrationsSettingsPanel({
  initialStatuses
}: {
  initialStatuses: IntegrationStatusRow[];
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [syncingProvider, setSyncingProvider] = useState<GoogleProvider | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const statusByProvider = useMemo(() => {
    return new Map(statuses.map((status) => [status.provider, status]));
  }, [statuses]);

  async function refreshStatuses() {
    const nextStatuses = await loadIntegrationStatusesAction();
    setStatuses(nextStatuses as IntegrationStatusRow[]);
  }

  async function handleSync(provider: GoogleProvider) {
    setSyncingProvider(provider);
    setMessages((prev) => ({ ...prev, [provider]: "" }));

    try {
      const result = await triggerSyncAction(provider, false);
      if (!result.success) {
        setMessages((prev) => ({ ...prev, [provider]: result.message }));
        return;
      }

      await refreshStatuses();
      setMessages((prev) => ({
        ...prev,
        [provider]: `Synced ${result.coursesSynced} courses, ${result.assignmentsSynced} assignments, ${result.eventsSynced} events.`
      }));
    } catch (error: any) {
      setMessages((prev) => ({
        ...prev,
        [provider]: error?.message || "Sync failed."
      }));
    } finally {
      setSyncingProvider(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Settings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Integrations</h1>
        </div>
        <Link
          className="text-sm font-semibold text-primary hover:text-blue-700"
          href="/"
        >
          Back to workspace
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {googleCards.map((card) => {
          const status = statusByProvider.get(card.provider);
          const isConnected = status?.status === "connected";
          const Icon = card.icon;

          return (
            <section
              className="rounded-2xl border border-line bg-white/80 p-5 shadow-soft"
              key={card.provider}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.accentClass}`}>
                    <Icon size={21} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-ink">{card.title}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                      {isConnected ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="text-emerald-700">Connected</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-slate-400" />
                          <span className="text-slate-500">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-muted">Last Sync</dt>
                  <dd className="font-bold text-ink">{formatTimestamp(status?.last_synced_at ?? null)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-muted">Connection Updated</dt>
                  <dd className="font-bold text-ink">{formatTimestamp(status?.updated_at ?? null)}</dd>
                </div>
              </dl>

              {messages[card.provider] ? (
                <p className="mt-3 text-xs font-semibold text-slate-600">{messages[card.provider]}</p>
              ) : null}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-glow transition hover:bg-blue-700"
                  href={`/settings/integrations/google/connect?provider=${card.provider}`}
                >
                  {isConnected ? "Reconnect" : card.connectLabel}
                </Link>
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-primary transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isConnected || syncingProvider !== null}
                  onClick={() => handleSync(card.provider)}
                  type="button"
                >
                  <RefreshCw size={15} className={syncingProvider === card.provider ? "animate-spin" : ""} />
                  Sync Now
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
