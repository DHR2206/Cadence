# Cadence Architecture

## Overview

Cadence is split into three layers:

- **Frontend:** Next.js interface for dashboard, workload forecast, collision warnings, and study planner.
- **Backend:** FastAPI service exposing planner endpoints.
- **Models:** Python planning engine that can run independently in tests or behind the API.

## Data Flow

```text
Student deadlines
      ↓
FastAPI /plan endpoint
      ↓
Planner engine
      ↓
Workload forecast + collisions + study plan
      ↓
Next.js dashboard
```

## Planner Logic

1. Parse semester start, available study hours, and deadline list.
2. Estimate deadline effort using explicit hours or difficulty-based defaults.
3. Group deadlines into semester weeks.
4. Mark risky weeks as low, medium, high, or crunch.
5. Redistribute preparation into earlier weeks.
6. Return a structured plan and explanation.

## API Endpoints

- `GET /health`: Confirms backend is running.
- `POST /plan`: Generates workload forecast, collision warnings, and study sessions.

## Frontend Pages

The MVP currently uses one dashboard page that combines:

- Overview and progress metrics
- Workload forecast chart
- Collision warning panel
- AI suggestion card
- Weekly study planner
- Mid-evaluation progress summary
