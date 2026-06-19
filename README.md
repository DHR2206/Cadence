# Cadence

## AI-Powered Deadline Collision Predictor & Academic Planner

Cadence is an AI-assisted academic planning platform that helps students anticipate workload overload before it happens.

Instead of acting as another calendar that only displays due dates, Cadence analyzes assignments, quizzes, projects, and exams together to predict deadline collisions, identify high-pressure weeks, and generate balanced study plans that reduce stress and improve productivity.

The platform was built during the 7-Day AI Buildathon organized by AI Club, Dhirubhai Ambani University.

---

# The Problem

University students manage academic responsibilities across multiple platforms including Moodle, Google Classroom, email notifications, messaging groups, calendars, and club announcements.

Although these tools record deadlines, they fail to answer practical questions that students face every semester:

* Which week will become overwhelming?
* Which deadlines are creating the workload spike?
* How much should I study each day to avoid last-minute pressure?
* What should I prioritize when multiple submissions overlap?

As a result, students often discover workload overload only a few days before deadlines, leading to stress, poor planning, reduced learning quality, and burnout.

Cadence was designed to solve this problem proactively rather than reactively.

---

# Our Solution

Cadence combines workload forecasting with intelligent scheduling to transform scattered deadlines into an actionable study plan.

By analyzing task difficulty, estimated effort, priorities, and available study hours, the system predicts future workload intensity and recommends how students should distribute their effort across upcoming days.

Instead of warning students after a collision occurs, Cadence predicts it early enough for meaningful intervention.

---

# Key Features

## Deadline Collision Detection

Detects overlapping assignments, quizzes, projects, and examinations that may create unmanageable workload spikes.

## Workload Forecasting

Visualizes workload across the semester and predicts academically intensive periods before they occur.

## AI-Assisted Study Planning

Generates balanced study schedules by considering:

* Deadline urgency
* Task priority
* Difficulty level
* Estimated effort
* Daily available study hours

## Risk Analysis Dashboard

Provides a consolidated overview of:

* Upcoming deadlines
* Weekly workload intensity
* Collision severity
* Planning recommendations

## Adaptive Planning

Schedules automatically adapt when new tasks or deadlines are introduced.

## Productivity Insights

Encourages consistent progress by distributing workload over time instead of concentrating effort near deadlines.

---

# Why Cadence is Different

Traditional planners answer:

> "When is my deadline?"

Cadence answers:

* When will I become overloaded?
* Why will that happen?
* Which tasks are responsible?
* What should I start today to avoid it?

This shift from deadline tracking to workload prediction makes Cadence a proactive academic assistant rather than a passive planner.

---

# System Architecture

```
Student Tasks & Deadlines
            │
            ▼
Deadline & Task Analysis
            │
            ▼
Workload Prediction Engine
            │
            ▼
Collision Detection
            │
            ▼
Schedule Optimization
            │
            ▼
Personalized Study Plan
            │
            ▼
Interactive Dashboard
```

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Lucide React

## Backend

* FastAPI
* Python
* Pydantic

## Planning Engine

* Rule-Based Scheduling
* Workload Forecasting Algorithms
* Deadline Collision Detection
* Schedule Optimization Logic

## Testing

* Pytest

## Deployment

* Vercel

---

# AI Usage Disclosure

AI tools were used to accelerate development and improve productivity.

Development Assistance:

* ChatGPT (OpenAI)
* Claude (Anthropic)

Current Planning Logic:

* Rule-based scheduling engine
* Workload forecasting algorithms
* Deadline collision detection

Planned AI Enhancements:

* LLM-based effort estimation
* Personalized study recommendations
* Natural language schedule explanations
* Intelligent workload balancing

No proprietary datasets were used.

The system operates entirely on user-provided academic information and sample semester datasets.

---

# Impact

Cadence aims to improve both academic performance and student well-being.

Expected benefits include:

* Reduced workload spikes
* Early identification of deadline conflicts
* Better time management
* Lower academic stress
* Increased productivity
* More balanced study habits
* Improved consistency throughout the semester

The platform is designed for university students managing multiple courses, projects, extracurricular activities, and personal commitments.

---

# Sustainable Development Goals

## SDG 3 – Good Health and Well-Being

Supports student mental well-being by reducing stress caused by poor workload distribution and deadline overload.

## SDG 4 – Quality Education

Promotes effective learning through structured planning, consistent study habits, and improved academic organization.

---

# Future Roadmap

* Moodle Integration
* Google Classroom Integration
* Calendar Synchronization
* Persistent User Accounts
* Cloud Database Support
* Push Notifications
* Email Reminders
* AI-generated Productivity Insights
* Mobile Application
* Collaborative Group Planning
* Calendar Export Support

---

# Repository Structure

```
cadence/

├── frontend/
├── backend/
├── models/
├── docs/
├── assets/
├── BLOG.md
├── README.md
└── LICENSE
```

---

# Local Setup

## Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

Health Check

```bash
curl http://localhost:8000/health
```

Run Tests

```bash
pytest backend/tests
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Open:

```
http://localhost:3000
```

---

# Deployment

Live Demo

https://cadence-seven-eta.vercel.app/

GitHub Repository

https://github.com/DHR2206/cadence

---

# Team – Neural Nexus

## Tanvi Nakum

* UI/UX Design
* Frontend Development
* Database Design

## Daksh Rathod

* Backend Development
* Planning Engine
* AI Logic
* Deployment & Infrastructure

---

# Vision

Cadence is built on a simple belief:

Students should spend less time worrying about deadlines and more time learning.

By predicting workload overload before it happens and generating actionable study plans, Cadence aims to become an intelligent academic companion that helps students work consistently, reduce stress, and achieve better outcomes throughout their university journey.
