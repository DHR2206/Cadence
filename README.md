# Cadence

Cadence is an AI-powered deadline collision predictor and academic planner for DAU students. It forecasts workload-heavy weeks before they happen, highlights deadline clashes, and generates a balanced study plan so students can avoid last-minute crunch.

## Mid-Evaluation Submission

- **Public GitHub Repository:** https://github.com/DHR2206/cadence
- **Hosting :** https://cadence-5ro17ct3x-dakshrathod2206-1057s-projects.vercel.app/auth/sign-in#
- **Current Stage:** MVP prototype for mid-evaluation review

## Problem Statement

DAU students manage assignments, quizzes, exams, club commitments, and personal work across scattered platforms such as Moodle, Google Classroom, calendars, notices, and memory. Existing tools show due dates, but they do not predict when deadlines will collide or automatically redistribute effort before a high-pressure week.

Cadence focuses on one core problem: **students realize workload overload too late**. The project helps students identify crunch weeks early, understand which deadlines are causing pressure, and convert academic work into an actionable study schedule.

## Current Progress

- Created the required mid-evaluation repository structure with separate `frontend/`, `backend/`, `models/`, `docs/`, and `assets/` directories.
- Built a rule-based planner engine in `models/` for effort estimation, deadline collision detection, and workload smoothing.
- Added a FastAPI backend with `/health` and `/plan` endpoints.
- Built a polished Next.js dashboard for viewing workload risk, upcoming deadlines, and generated study plans.
- Hosted the frontend MVP on Vercel for review and demo access.
- Added DAU-style sample semester data for judging-day demonstrations.
- Added backend planner tests for empty, balanced, overloaded, collision, and replanning scenarios.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, lucide-react
- **Backend:** FastAPI, Python, Pydantic
- **Planner Engine:** Python rule-based scheduling model
- **Data:** JSON sample data for the MVP
- **Testing:** pytest for backend planner tests
- **Deployment:** Vercel for the frontend; backend currently runs locally for the MVP

## Planned Features

- Manual course, task, and deadline entry from the frontend
- Direct frontend integration with the FastAPI `/plan` endpoint
- Deadline collision forecast with risk levels and workload-heavy week alerts
- Auto-generated balanced study plans based on estimated effort and priority
- Workload timeline showing before and after optimization
- AI explanation card for schedule changes and recommendations
- Persistent schedule storage
- Moodle and Google Classroom import
- Email or push reminders
- Calendar export and group project planning

## Repository Structure

```text
cadence/
├── README.md
├── docs/
│   ├── architecture.md
│   └── mid-evaluation.md
├── frontend/
│   └── Next.js dashboard and planner UI
├── backend/
│   ├── app/
│   └── tests/
├── models/
│   └── planner.py
├── assets/
│   ├── design/
│   └── sample-data/
└── LICENSE
```

## Setup Instructions

### Backend

From the project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend health check:

```bash
curl http://localhost:8000/health
```

Run backend tests from the project root:

```bash
python3 -m pytest backend/tests
```

### Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local app at:

```text
http://localhost:3000
```

The deployed frontend is available at:

```text
https://cadence-seven-eta.vercel.app/#
```

## API Preview

`POST /plan`

```json
{
  "semester_start": "2026-06-22",
  "weeks": 12,
  "available_hours_per_week": 25,
  "deadlines": [
    {
      "id": "cs401-project",
      "course": "CS401",
      "title": "AI Systems Final Project",
      "due_date": "2026-07-31",
      "difficulty": 5,
      "estimated_hours": 14,
      "priority": "high"
    }
  ]
}
```

## Mid-Evaluation Status

Cadence is currently an MVP-quality prototype. The frontend demonstrates the target product experience and is hosted on Vercel, while the backend contains working planning logic that can power the dashboard locally. The next milestone is connecting manual frontend input directly to the FastAPI `/plan` endpoint and adding persistence for generated schedules.
