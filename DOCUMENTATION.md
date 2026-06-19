# Cadence – Project Documentation

## Introduction

Cadence was born from a problem that almost every university student has experienced.

Assignments are posted on Moodle, quizzes are announced in WhatsApp groups, project updates come through Google Classroom, and important notices arrive via email. Even with so many platforms, students still end up missing deadlines or facing overwhelming weeks where everything is due at once.

As students ourselves, we experienced this repeatedly and realized that the problem wasn't laziness or poor planning—it was fragmented information.

We wanted to build something that could look at all these deadlines together, understand future workload, and tell students **before** they reached a stressful week.

That idea became Cadence.

---

# The Problem

Traditional planners are good at storing deadlines.

But they don't answer questions like:

* Which week will be the busiest?
* Which deadlines are creating the workload spike?
* What should I start working on today?
* How can I avoid last-minute cramming?

Students often realize they are overloaded only when deadlines are just a few days away.

By then, there is very little they can do.

Cadence aims to solve this problem by helping students plan proactively instead of reacting at the last moment.

---

# Our Approach

Rather than creating another to-do list application, we focused on building an intelligent planning assistant.

Cadence analyzes academic tasks collectively, predicts workload-heavy periods, detects deadline collisions, and generates balanced study schedules based on available time and task priority.

The goal is simple:

**Help students stay ahead instead of catching up.**

---

# How Cadence Works

The workflow is straightforward.

1. Students add their assignments, quizzes, projects, and exams.

2. Cadence analyzes deadlines, priorities, and estimated effort.

3. The planning engine predicts future workload distribution.

4. If multiple important tasks overlap, the system detects a deadline collision.

5. An optimized study plan is generated to spread the workload over time.

6. Whenever a new task is added, the schedule adapts automatically.

Instead of waiting for stressful weeks to arrive, students receive early guidance and can plan accordingly.

---

# Features

### Deadline Collision Detection

Identifies overlapping submissions before they become overwhelming.

### Workload Forecasting

Predicts busy weeks across the semester, giving students time to prepare.

### AI-Assisted Study Planning

Generates balanced study schedules based on task priority, difficulty, and available study hours.

### Adaptive Scheduling

Updates recommendations whenever new deadlines are introduced.

### Risk Dashboard

Provides an overview of workload intensity, upcoming deadlines, and planning suggestions.

---

# Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* FastAPI
* Python

### Planning Engine

* Workload Forecasting
* Deadline Collision Detection
* Schedule Optimization

### Testing

* Pytest

### Deployment

* Vercel

---

# AI in Cadence

Our goal was never to include AI just because it is popular.

We wanted AI to solve a genuine problem.

Today, Cadence uses intelligent planning logic to forecast workload and recommend balanced schedules.

In the future, we plan to extend this with:

* LLM-based effort estimation
* Personalized productivity recommendations
* Natural-language study explanations
* Adaptive planning based on user behavior

We see AI as a planning companion that supports students rather than replacing their decisions.

---

# Challenges We Faced

Building Cadence in just seven days came with its own challenges.

One of the biggest technical hurdles was designing a workload prediction system that produced meaningful recommendations instead of simply sorting tasks by deadline.

At the same time, creating a clean and intuitive dashboard required multiple iterations to ensure students could quickly understand their workload without feeling overwhelmed.

Another challenge was integrating the frontend and backend while continuously adding new features under a tight timeline.

Every improvement required careful coordination and constant testing.

These challenges pushed us to prioritize simplicity, usability, and reliability throughout development.

---

# Impact

We believe Cadence can make a meaningful difference in students' academic lives.

By identifying workload spikes early and encouraging consistent study habits, the platform helps reduce stress, improve planning, and create a healthier balance between academics and extracurricular activities.

Rather than encouraging students to work harder, Cadence helps them work smarter.

---

# Future Vision

Our vision extends beyond a single planner.

We imagine Cadence becoming an AI Academic Operating System that integrates with Moodle, Google Classroom, university calendars, and other educational platforms.

In the future, students should not have to manually manage dozens of deadlines across different applications.

Instead, one intelligent system should understand their workload, adapt to changes, and guide them throughout their academic journey.

---

# What This Project Means to Us

Cadence is more than a hackathon submission.

It is a project inspired by our own experiences and the everyday struggles of students around us.

Throughout this buildathon, we learned that solving real problems requires more than writing code—it requires listening to users, making thoughtful design decisions, collaborating effectively, and constantly iterating.

Building Cadence has shown us how technology can simplify everyday challenges and improve student well-being in a meaningful way.

---

# Conclusion

Students should spend less time worrying about deadlines and more time learning.

Cadence transforms scattered deadlines into clear, actionable plans and helps students prepare before stress builds up.

This is just the beginning, but we believe it is a step toward a future where academic planning is intelligent, proactive, and truly student-centered.
