import type { Metadata } from "next";
import { ContentSection, FeatureGrid, PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Cadence, the AI-powered academic planner for students."
};

const features = [
  {
    title: "Deadline Intelligence",
    body: "Cadence centralizes assignments, due dates, estimated effort, and priority signals so students can see workload risk early."
  },
  {
    title: "Adaptive Study Planning",
    body: "The planner converts academic pressure into weekly study blocks that respect capacity, preferred study windows, and task difficulty."
  },
  {
    title: "Explainable AI",
    body: "Cadence explains why a task is high risk, why a week is overloaded, and what changed after the schedule is balanced."
  },
  {
    title: "Persistent Academic Memory",
    body: "Students can save study preferences and learning observations that improve future planning and assistant responses."
  }
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About Cadence"
      title="An academic operating system for modern students"
      description="Cadence helps students turn scattered academic commitments into a clear, explainable, and personalized plan."
    >
      <ContentSection title="What is Cadence">
        <p>
          Cadence is an AI-powered academic planner that combines deadlines, course context, calendar commitments, and study
          preferences into one planning workspace. It helps students understand what matters now, what is becoming risky, and
          how to distribute work before crunch weeks arrive.
        </p>
      </ContentSection>

      <ContentSection title="Mission">
        <p>
          Our mission is to make academic planning calmer, more transparent, and more proactive. Students should not need to
          discover workload collisions the night before an exam or assignment deadline.
        </p>
      </ContentSection>

      <ContentSection title="Features">
        <FeatureGrid items={features} />
      </ContentSection>

      <ContentSection title="AI Planning">
        <p>
          Cadence uses structured academic data and explainable planning logic to forecast workload pressure, prioritize
          assignments, and generate study sessions. AI is used to improve clarity and personalization while keeping the
          underlying schedule grounded in real deadlines and capacity constraints.
        </p>
      </ContentSection>

      <ContentSection title="Google Classroom Integration">
        <p>
          With user permission, Cadence can read Google Classroom courses and coursework to import assignments and due dates.
          This reduces manual entry and helps students generate plans from the academic systems they already use.
        </p>
      </ContentSection>

      <ContentSection title="Google Calendar Integration">
        <p>
          With user permission, Cadence can read Google Calendar events to understand classes, commitments, and blocked time.
          This helps Cadence recommend study blocks that fit around the student&apos;s existing schedule.
        </p>
      </ContentSection>

      <ContentSection title="Future Roadmap">
        <p>
          Cadence is designed to expand into deeper LMS support, smarter reminder workflows, collaborative study planning,
          richer analytics, and integrations that help students move from reactive deadline tracking to proactive academic
          execution.
        </p>
      </ContentSection>
    </PublicPageShell>
  );
}
