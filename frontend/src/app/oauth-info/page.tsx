import type { Metadata } from "next";
import { ContentSection, PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Google OAuth Information",
  description: "Why Cadence requests Google profile, Classroom, and Calendar permissions."
};

const scopes = [
  {
    scope: "profile",
    accessed: "Your basic Google profile information, such as display name and account identifier.",
    needed: "Cadence uses this to show which Google account is connected and to associate the integration with your Cadence account.",
    improves: "This prevents confusion when students use multiple Google accounts for school and personal calendars."
  },
  {
    scope: "email",
    accessed: "Your Google account email address.",
    needed: "Cadence uses your email to confirm account ownership and display the connected account in integration settings.",
    improves: "Students can verify they connected the correct school account before syncing academic data."
  },
  {
    scope: "classroom.courses.readonly",
    accessed: "Read-only access to Google Classroom course names, identifiers, sections, and course metadata.",
    needed: "Cadence uses courses to organize imported coursework by class and build accurate academic context.",
    improves: "Assignments are grouped by course so workload, priority, and study plans are easier to understand."
  },
  {
    scope: "classroom.coursework.me.readonly",
    accessed: "Read-only access to coursework assigned to the signed-in student, including titles, descriptions, due dates, and coursework metadata.",
    needed: "Cadence uses coursework to create deadlines and estimate upcoming workload pressure.",
    improves: "Students can generate study plans without manually re-entering every Classroom assignment."
  },
  {
    scope: "calendar.readonly",
    accessed: "Read-only access to calendar lists and calendar events such as titles, start times, end times, and descriptions.",
    needed: "Cadence uses calendar events to identify existing commitments and avoid scheduling study sessions during blocked time.",
    improves: "Study plans become more realistic because they account for classes, meetings, and personal commitments."
  }
];

export default function OAuthInfoPage() {
  return (
    <PublicPageShell
      eyebrow="Google OAuth Review"
      title="Why Cadence requests Google permissions"
      description="Cadence requests the minimum Google permissions needed to import academic context, avoid calendar conflicts, and generate useful study plans."
    >
      <ContentSection title="Google API Data Use">
        <p>
          Cadence uses Google data only to provide planning, scheduling, reminders, and academic insights requested by the
          user. Google data is not sold, used for advertising, or shared with unrelated third parties.
        </p>
      </ContentSection>

      <section className="grid gap-4">
        {scopes.map((item) => (
          <article className="rounded-3xl border border-line bg-white/78 p-6 shadow-soft md:p-8" key={item.scope}>
            <p className="font-mono text-sm font-bold text-primary">{item.scope}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <h2 className="text-base font-bold text-ink">What data is accessed</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.accessed}</p>
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Why it is needed</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.needed}</p>
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">User experience benefit</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.improves}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <ContentSection title="User Control">
        <p>
          Users can disconnect Google integrations from Cadence settings or revoke access directly in their Google Account.
          Disconnecting stops future syncs. Cadence keeps imported data only as needed to provide the user&apos;s academic
          planning experience unless the user deletes it or requests account deletion.
        </p>
      </ContentSection>
    </PublicPageShell>
  );
}
