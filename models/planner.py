from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from math import ceil
from typing import Any


@dataclass(frozen=True)
class Deadline:
    id: str
    course: str
    title: str
    due_date: date
    difficulty: int = 3
    estimated_hours: float | None = None
    priority: str = "medium"

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "Deadline":
        due_date = payload.get("due_date") or payload.get("dueDate")
        if isinstance(due_date, str):
            parsed_date = datetime.fromisoformat(due_date).date()
        elif isinstance(due_date, date):
            parsed_date = due_date
        else:
            raise ValueError("deadline due_date is required")

        return cls(
            id=str(payload.get("id") or f"{payload.get('course', 'course')}-{payload.get('title', 'task')}"),
            course=str(payload.get("course", "General")),
            title=str(payload.get("title", "Untitled task")),
            due_date=parsed_date,
            difficulty=max(1, min(5, int(payload.get("difficulty", 3)))),
            estimated_hours=(
                float(payload["estimated_hours"])
                if payload.get("estimated_hours") is not None
                else None
            ),
            priority=str(payload.get("priority", "medium")).lower(),
        )

    @property
    def effort_hours(self) -> float:
        if self.estimated_hours is not None:
            return max(0.5, self.estimated_hours)
        priority_boost = {"low": 0.8, "medium": 1.0, "high": 1.25}.get(self.priority, 1.0)
        return round((1.5 + self.difficulty * 1.4) * priority_boost, 1)


@dataclass(frozen=True)
class PlannerInput:
    semester_start: date
    weeks: int
    available_hours_per_week: float
    deadlines: list[Deadline] = field(default_factory=list)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "PlannerInput":
        semester_start = payload.get("semester_start") or payload.get("semesterStart")
        if isinstance(semester_start, str):
            parsed_start = datetime.fromisoformat(semester_start).date()
        elif isinstance(semester_start, date):
            parsed_start = semester_start
        else:
            parsed_start = date.today()

        return cls(
            semester_start=parsed_start,
            weeks=int(payload.get("weeks", 12)),
            available_hours_per_week=float(payload.get("available_hours_per_week", 25)),
            deadlines=[Deadline.from_dict(item) for item in payload.get("deadlines", [])],
        )


@dataclass(frozen=True)
class PlannerResult:
    workload_by_week: list[dict[str, Any]]
    collisions: list[dict[str, Any]]
    study_plan: list[dict[str, Any]]
    summary: dict[str, Any]
    suggestion: str


def _week_index(semester_start: date, target: date, weeks: int) -> int:
    delta_days = (target - semester_start).days
    return max(1, min(weeks, delta_days // 7 + 1))


def _risk_level(hours: float, capacity: float) -> str:
    if capacity <= 0:
        return "crunch"
    ratio = hours / capacity
    if ratio >= 1:
        return "crunch"
    if ratio >= 0.75:
        return "high"
    if ratio >= 0.45:
        return "medium"
    return "low"


def _daily_slots(week: int, hours: float, deadline: Deadline) -> list[dict[str, Any]]:
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    remaining = round(hours, 1)
    sessions: list[dict[str, Any]] = []
    slot = 0

    while remaining > 0:
        session_hours = min(2.0, remaining)
        day = days[slot % len(days)]
        start_hour = 9 + (slot % 3) * 3
        sessions.append(
            {
                "week": week,
                "day": day,
                "start": f"{start_hour:02d}:00",
                "end": f"{start_hour + int(ceil(session_hours)):02d}:00",
                "course": deadline.course,
                "title": deadline.title,
                "hours": session_hours,
                "type": "deep-work" if deadline.difficulty >= 4 else "study",
            }
        )
        remaining = round(remaining - session_hours, 1)
        slot += 1

    return sessions


def generate_plan(payload: PlannerInput | dict[str, Any]) -> PlannerResult:
    data = payload if isinstance(payload, PlannerInput) else PlannerInput.from_dict(payload)
    weeks = max(1, data.weeks)
    capacity = max(1, data.available_hours_per_week)
    raw_week_hours = {week: 0.0 for week in range(1, weeks + 1)}
    week_deadlines: dict[int, list[Deadline]] = {week: [] for week in range(1, weeks + 1)}

    for deadline in data.deadlines:
        week = _week_index(data.semester_start, deadline.due_date, weeks)
        raw_week_hours[week] += deadline.effort_hours
        week_deadlines[week].append(deadline)

    smoothed_week_hours = {week: 0.0 for week in range(1, weeks + 1)}
    study_plan: list[dict[str, Any]] = []

    for deadline in sorted(data.deadlines, key=lambda item: item.due_date):
        due_week = _week_index(data.semester_start, deadline.due_date, weeks)
        effort = deadline.effort_hours
        prep_window = max(1, min(3, due_week))
        candidate_weeks = list(range(max(1, due_week - prep_window + 1), due_week + 1))
        weights = list(range(len(candidate_weeks), 0, -1))
        weight_sum = sum(weights)

        for week, weight in zip(candidate_weeks, weights):
            allocated = round(effort * weight / weight_sum, 1)
            smoothed_week_hours[week] += allocated
            study_plan.extend(_daily_slots(week, allocated, deadline))

    workload_by_week = []
    for week in range(1, weeks + 1):
        before = round(raw_week_hours[week], 1)
        after = round(smoothed_week_hours[week], 1)
        workload_by_week.append(
            {
                "week": week,
                "label": f"W{week}",
                "before_hours": before,
                "after_hours": after,
                "risk": _risk_level(before, capacity),
                "optimized_risk": _risk_level(after, capacity),
                "deadline_count": len(week_deadlines[week]),
            }
        )

    collisions = [
        {
            "week": week,
            "deadline_count": len(items),
            "total_hours": round(raw_week_hours[week], 1),
            "severity": _risk_level(raw_week_hours[week], capacity),
            "deadlines": [
                {
                    "id": item.id,
                    "course": item.course,
                    "title": item.title,
                    "due_date": item.due_date.isoformat(),
                    "impact": "high" if item.difficulty >= 4 or item.priority == "high" else "medium",
                }
                for item in items
            ],
        }
        for week, items in week_deadlines.items()
        if len(items) >= 2 or raw_week_hours[week] >= capacity * 0.75
    ]

    peak_before = max(raw_week_hours.values(), default=0)
    peak_after = max(smoothed_week_hours.values(), default=0)
    improvement = 0 if peak_before == 0 else round((peak_before - peak_after) / peak_before * 100)
    crunch_weeks = [item["week"] for item in workload_by_week if item["risk"] in {"high", "crunch"}]
    next_collision = collisions[0] if collisions else None

    if next_collision:
        suggestion = (
            f"Week {next_collision['week']} has {next_collision['deadline_count']} competing deadlines. "
            "Cadence redistributed preparation into earlier weeks to reduce last-minute pressure."
        )
    elif data.deadlines:
        suggestion = "No severe collision detected. Cadence keeps lighter review blocks before each due date."
    else:
        suggestion = "Add course deadlines to generate a collision forecast and balanced study plan."

    return PlannerResult(
        workload_by_week=workload_by_week,
        collisions=collisions,
        study_plan=study_plan,
        summary={
            "deadline_count": len(data.deadlines),
            "available_hours_per_week": capacity,
            "peak_before_hours": round(peak_before, 1),
            "peak_after_hours": round(peak_after, 1),
            "peak_reduction_percent": improvement,
            "crunch_weeks": crunch_weeks,
            "productivity_score": max(50, min(98, 82 + improvement // 2)),
        },
        suggestion=suggestion,
    )


def result_to_dict(result: PlannerResult) -> dict[str, Any]:
    return {
        "workload_by_week": result.workload_by_week,
        "collisions": result.collisions,
        "study_plan": result.study_plan,
        "summary": result.summary,
        "suggestion": result.suggestion,
    }
