# Cadence

Cadence is an AI-powered deadline collision predictor and academic planner for DAU students. It forecasts workload-heavy weeks before they happen, highlights deadline clashes, and generates a balanced study plan so students can avoid last-minute crunch.

## Problem Statement

DAU students manage assignments, quizzes, exams, club commitments, and personal work across scattered platforms such as Moodle, Google Classroom, calendars, notices, and memory. Existing tools show due dates, but they do not predict when deadlines will collide or automatically redistribute effort before a high-pressure week.

Cadence focuses on one core problem: **students realize workload overload too late**. The project helps students see crunch weeks early and convert deadlines into an actionable study schedule.

## Current Progress

- Created the required mid-evaluation repository structure.
- Built a rule-based planner engine in `models/` for effort estimation, collision detection, and workload smoothing.
- Added a FastAPI backend with `/health` and `/plan` endpoints.
- Built a polished Next.js dashboard inspired by the provided Cadence design reference.
- Added DAU-style sample semester data for judging-day demos.
- Added backend planner tests for empty, balanced, overloaded, collision, and replanning cases.

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, lucide-react
- **Backend:** FastAPI, Python, Pydantic
- **Planner Engine:** Python rule-based scheduling model
- **Data:** JSON sample data for the MVP
- **Deployment Target:** Vercel for frontend, Render or Railway for backend

## Planned Features

- Manual course and deadline entry
- Deadline collision forecast
- Auto-generated balanced study plan
- Workload timeline dashboard showing before and after optimization
- AI explanation card for schedule changes
- Moodle and Google Classroom import
- Email or push reminders
- Club and committee recommendation during lighter weeks
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
│   └── sample-data/
└── LICENSE
```

## Setup Instructions

### Backend

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

```bash
cd frontend
npm install
npm run dev
```

Open the app at:

```text
http://localhost:3000
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

Cadence is currently an MVP-quality prototype. The frontend demonstrates the target product experience, and the backend contains working planning logic that can power the dashboard. The next milestone is connecting manual frontend input directly to the FastAPI `/plan` endpoint and persisting schedules.
