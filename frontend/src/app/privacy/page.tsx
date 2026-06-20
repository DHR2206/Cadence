import type { Metadata } from "next";
import { ContentSection, PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Cadence collects, uses, stores, and protects academic planning data."
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy Policy"
      title="Privacy practices for Cadence academic planning"
      description="Cadence uses student-authorized data only to provide planning, scheduling, reminders, and academic insights. We do not sell personal data or Google user data."
    >
      <ContentSection title="Introduction">
        <p>
          Cadence is an AI-powered academic planner that helps students understand deadlines, schedule focused work, and
          make better study decisions. This Privacy Policy explains what we collect, why we collect it, and how we protect
          it when you use Cadence.
        </p>
      </ContentSection>

      <ContentSection title="Information We Collect">
        <p>
          We collect account details such as your name, email address, profile preferences, university context, semester
          settings, course information, assignments, study sessions, productivity inputs, and integration connection status.
          We use this information to operate the product and personalize academic planning.
        </p>
      </ContentSection>

      <ContentSection title="Google Account Information">
        <p>
          When you connect Google, Cadence may receive your Google profile name, email address, and Google account identifier
          to confirm which account is connected. This information is used for authentication, account display, and integration
          management.
        </p>
      </ContentSection>

      <ContentSection title="Google Classroom Data Usage">
        <p>
          If you connect Google Classroom, Cadence reads course and coursework information such as class names, assignment
          titles, descriptions, due dates, and related course metadata. Cadence uses this data to create deadlines, predict
          workload collisions, prioritize tasks, and generate academic planning insights.
        </p>
        <p>
          Cadence does not use Google Classroom data for advertising, does not sell it, and does not share it with unrelated
          third parties.
        </p>
      </ContentSection>

      <ContentSection title="Google Calendar Data Usage">
        <p>
          If you connect Google Calendar, Cadence reads calendar events such as event titles, times, descriptions, and
          availability context. Cadence uses this data to avoid scheduling conflicts, recommend study blocks, and improve
          reminder timing.
        </p>
        <p>
          Cadence requests calendar access only to support planning, scheduling, reminders, and academic insights.
        </p>
      </ContentSection>

      <ContentSection title="Data Storage">
        <p>
          Cadence stores user profiles, deadlines, study plans, integration records, and AI memory entries in Supabase.
          OAuth credentials are encrypted before storage. We retain data while your account is active or as needed to provide
          the service, comply with law, resolve disputes, and maintain security.
        </p>
      </ContentSection>

      <ContentSection title="Data Security">
        <p>
          Cadence uses Supabase authentication, row-level security policies, server-side OAuth handling, encrypted credential
          storage, and protected routes to reduce unauthorized access risk. No system is perfectly secure, but we design
          Cadence with least-privilege access and user ownership controls.
        </p>
      </ContentSection>

      <ContentSection title="Third Party Services">
        <p>
          Cadence uses Supabase for authentication and database services, Google APIs for user-authorized Classroom and
          Calendar integrations, Vercel for hosting, and AI providers for planning and academic assistance. These services
          process data only as needed to provide Cadence functionality.
        </p>
      </ContentSection>

      <ContentSection title="User Rights">
        <p>
          You may request access, correction, export, or deletion of your Cadence account data. You may also disconnect
          integrations at any time. We will respond to reasonable requests consistent with applicable law and product security
          requirements.
        </p>
      </ContentSection>

      <ContentSection title="Account Disconnection">
        <p>
          You can disconnect Google integrations from Cadence settings or revoke Cadence access from your Google Account
          permissions page. After disconnection, Cadence stops syncing new Google data. Previously imported academic data can
          be deleted from your Cadence account on request or through available product controls.
        </p>
      </ContentSection>

      <ContentSection title="Contact Information">
        <p>
          For privacy questions, data requests, or Google integration concerns, contact the Cadence team at
          support@cadence-ai.app.
        </p>
      </ContentSection>
    </PublicPageShell>
  );
}
