"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

const studyTimeOptions = [
  { value: "morning", label: "Morning (8AM - 12PM)" },
  { value: "afternoon", label: "Afternoon (12PM - 4PM)" },
  { value: "evening", label: "Evening (4PM - 8PM)" },
  { value: "night", label: "Night (8PM - 12AM)" },
  { value: "flexible", label: "Flexible / Dynamic" }
];

const commonTimezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney"
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form State
  const [step, setStep] = useState(1);
  const [universityName, setUniversityName] = useState("");
  const [semester, setSemester] = useState("");
  const [capacity, setCapacity] = useState(25);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [timezone, setTimezone] = useState("UTC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/auth/sign-in");
        return;
      }
      setUser(data.session.user);

      // Try fetching profile timezone as default
      const { data: profile } = await supabase
        .from("profiles")
        .select("timezone, onboarding_completed")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        router.push("/");
        return;
      }

      if (profile?.timezone) {
        setTimezone(profile.timezone);
      } else {
        // Fallback to browser timezone if supported
        try {
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (browserTimezone) {
            setTimezone(browserTimezone);
          }
        } catch {}
      }
      setLoadingUser(false);
    }
    void checkSession();
  }, [supabase, router]);

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-medium text-muted">Loading onboarding workspace...</p>
      </main>
    );
  }

  const nextStep = () => {
    if (step === 1 && !universityName.trim()) {
      setError("Please enter your university name.");
      return;
    }
    if (step === 2 && !semester.trim()) {
      setError("Please specify your current semester.");
      return;
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          university_name: universityName.trim(),
          semester: semester.trim(),
          weekly_capacity_hours: capacity,
          preferred_study_time: preferredTime,
          timezone,
          onboarding_completed: true
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="glass-panel w-full max-w-xl rounded-3xl p-8 transition-all duration-300">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Cadence Onboarding</p>
              <p className="text-xs text-muted">Setup your academic preferences</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-muted">
              <span>Step {step} of 5</span>
              <span>{Math.round(((step - 1) / 4) * 100)}% Complete</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        {/* Step 1: University */}
        {step === 1 ? (
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-2xl font-bold text-ink">Which university do you attend?</legend>
            <p className="text-sm leading-6 text-muted">We use this to customize Moodle integrations and local academic terms.</p>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">University Name</span>
              <input
                autoFocus
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm focus:focus-ring"
                name="university"
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="e.g. Stanford University"
                required
                type="text"
                value={universityName}
              />
            </label>
          </fieldset>
        ) : null}

        {/* Step 2: Semester */}
        {step === 2 ? (
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-2xl font-bold text-ink">What is your current semester?</legend>
            <p className="text-sm leading-6 text-muted">Help us bound your calendars and workload timelines accurately.</p>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Academic Term / Semester</span>
              <input
                autoFocus
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm focus:focus-ring"
                name="semester"
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Fall 2026"
                required
                type="text"
                value={semester}
              />
            </label>
          </fieldset>
        ) : null}

        {/* Step 3: Capacity */}
        {step === 3 ? (
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-2xl font-bold text-ink">Set your weekly study capacity</legend>
            <p className="text-sm leading-6 text-muted">Specify the maximum target study hours you want to invest per week.</p>
            <div className="grid gap-4 rounded-2xl border border-line bg-slate-50/50 p-5">
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Study Hours</span>
                <span className="text-3xl font-extrabold text-primary">{capacity}h</span>
              </div>
              <input
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary"
                max="80"
                min="5"
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                step="1"
                type="range"
                value={capacity}
              />
              <div className="flex justify-between text-xs text-muted">
                <span>5 hrs</span>
                <span>Balanced: 25 hrs</span>
                <span>80 hrs</span>
              </div>
            </div>
          </fieldset>
        ) : null}

        {/* Step 4: Preferred time */}
        {step === 4 ? (
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-2xl font-bold text-ink">When is your peak study time?</legend>
            <p className="text-sm leading-6 text-muted">Cadence schedules deep-work blocks during your highest energy periods.</p>
            <div className="grid gap-3">
              {studyTimeOptions.map((option) => (
                <button
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${
                    preferredTime === option.value
                      ? "border-primary bg-blue-50/50 text-primary"
                      : "border-line bg-white hover:bg-slate-50"
                  }`}
                  key={option.value}
                  onClick={() => setPreferredTime(option.value)}
                  type="button"
                >
                  <span>{option.label}</span>
                  {preferredTime === option.value ? <Check size={18} /> : null}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {/* Step 5: Timezone */}
        {step === 5 ? (
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-2xl font-bold text-ink">Confirm your timezone</legend>
            <p className="text-sm leading-6 text-muted">We use this to ensure deadlines sync with your local academic time zones.</p>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Timezone</span>
              <select
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm focus:focus-ring"
                name="timezone"
                onChange={(e) => setTimezone(e.target.value)}
                value={timezone}
              >
                {commonTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        ) : null}

        {/* Controls */}
        <footer className="mt-8 flex justify-between gap-4 border-t border-line pt-6">
          {step > 1 ? (
            <button
              className="flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={prevStep}
              type="button"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-blue-700 ml-auto"
              onClick={nextStep}
              type="button"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-blue-700 ml-auto disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? "Completing..." : "Complete Setup"}
              <Check size={16} />
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
