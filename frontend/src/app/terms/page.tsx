import type { Metadata } from "next";
import { ContentSection, PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of Cadence academic planning services."
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms of Service"
      title="Terms for using Cadence"
      description="These terms describe the responsibilities, limitations, and acceptable use rules for Cadence academic planning services."
    >
      <ContentSection title="Acceptance of Terms">
        <p>
          By creating an account, connecting an integration, or using Cadence, you agree to these Terms of Service. If you do
          not agree, do not use the service. Cadence may update these terms as the product evolves.
        </p>
      </ContentSection>

      <ContentSection title="User Responsibilities">
        <p>
          You are responsible for keeping your account secure, providing accurate academic information, reviewing generated
          plans before relying on them, and using Cadence in compliance with your school policies and applicable law.
        </p>
      </ContentSection>

      <ContentSection title="Academic Data Usage">
        <p>
          Cadence uses academic data you provide or authorize from Google Classroom and Google Calendar to create schedules,
          identify workload risks, generate reminders, and provide study insights. Cadence does not complete coursework for
          you and should not be used to violate academic integrity rules.
        </p>
      </ContentSection>

      <ContentSection title="Service Availability">
        <p>
          Cadence is provided on an evolving basis and may experience interruptions, maintenance windows, third-party API
          limits, or integration changes. We work to keep the service reliable, but we do not guarantee uninterrupted access.
        </p>
      </ContentSection>

      <ContentSection title="Limitation of Liability">
        <p>
          Cadence provides planning recommendations and academic insights, not professional academic, legal, or financial
          advice. You remain responsible for deadlines, course requirements, and final decisions. To the maximum extent
          permitted by law, Cadence is not liable for indirect, incidental, special, or consequential damages.
        </p>
      </ContentSection>

      <ContentSection title="Account Termination">
        <p>
          You may stop using Cadence at any time. We may suspend or terminate accounts that abuse the service, compromise
          security, violate these terms, or create risk for other users. You may request deletion of account data by contacting
          support.
        </p>
      </ContentSection>

      <ContentSection title="Contact Information">
        <p>For questions about these terms, contact the Cadence team at support@cadence-ai.app.</p>
      </ContentSection>
    </PublicPageShell>
  );
}
