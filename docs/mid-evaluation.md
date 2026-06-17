# Mid-Evaluation Checkpoint

## Project

**Cadence:** AI-powered deadline collision predictor and academic planner.

## Problem Statement

Students often discover workload overload only when multiple deadlines are already close. Cadence predicts deadline collisions earlier, estimates effort, and creates a balanced study schedule to reduce last-minute stress.

## Current Progress

- Repository organized into `docs/`, `frontend/`, `backend/`, `models/`, and `assets/`.
- Planner engine implemented with effort estimation, crunch-week detection, workload smoothing, and AI-ready explanations.
- FastAPI backend created with health and planning endpoints.
- Next.js frontend created with a dashboard, KPI cards, workload chart, collision panel, AI suggestion, and study planner.
- Sample DAU semester data added for reliable demos.
- Backend planner tests added for core scenarios.

## Technical Implementation

The MVP uses deterministic scheduling first so results are reliable during judging. The planner groups deadlines by week, estimates effort from difficulty and priority, detects overloaded weeks, and allocates preparation into earlier weeks. The frontend currently uses demo data matching the backend response shape; this allows the product UI to be reviewed while backend integration continues.

## Feasibility of Completion

The project is feasible for final submission because the core technical risk has been reduced: the planning model exists, the API exists, and the product interface exists. Remaining work is mainly integration, persistence, and demo polish.

## Next Steps

- Connect frontend forms to the backend `/plan` endpoint.
- Add manual deadline entry and edit states.
- Add simple local persistence or a database.
- Capture screenshots for the GitHub README.
- Deploy frontend and backend.
