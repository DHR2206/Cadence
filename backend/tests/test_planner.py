from datetime import date, timedelta

from models.planner import generate_plan


def _deadline(idx: int, week: int, difficulty: int = 3, hours: float | None = None):
    start = date(2026, 6, 22)
    return {
        "id": f"d{idx}",
        "course": f"CS{idx}",
        "title": f"Task {idx}",
        "due_date": (start + timedelta(days=(week - 1) * 7 + 4)).isoformat(),
        "difficulty": difficulty,
        "estimated_hours": hours,
        "priority": "high" if difficulty >= 4 else "medium",
    }


def test_no_deadlines_returns_empty_plan():
    result = generate_plan(
        {
            "semester_start": "2026-06-22",
            "weeks": 12,
            "available_hours_per_week": 25,
            "deadlines": [],
        }
    )

    assert result.summary["deadline_count"] == 0
    assert result.collisions == []
    assert result.study_plan == []


def test_balanced_deadlines_do_not_create_crunch_week():
    result = generate_plan(
        {
            "semester_start": "2026-06-22",
            "weeks": 12,
            "available_hours_per_week": 25,
            "deadlines": [_deadline(1, 2, 2), _deadline(2, 5, 3), _deadline(3, 9, 2)],
        }
    )

    assert all(item["risk"] != "crunch" for item in result.workload_by_week)
    assert result.summary["deadline_count"] == 3


def test_multiple_deadlines_same_week_create_collision():
    result = generate_plan(
        {
            "semester_start": "2026-06-22",
            "weeks": 12,
            "available_hours_per_week": 18,
            "deadlines": [_deadline(1, 6, 5), _deadline(2, 6, 4), _deadline(3, 6, 4)],
        }
    )

    assert result.collisions
    assert result.collisions[0]["week"] == 6
    assert result.collisions[0]["deadline_count"] == 3


def test_impossible_overload_is_marked_crunch():
    result = generate_plan(
        {
            "semester_start": "2026-06-22",
            "weeks": 12,
            "available_hours_per_week": 8,
            "deadlines": [_deadline(1, 3, 5, 14), _deadline(2, 3, 5, 12)],
        }
    )

    week_three = next(item for item in result.workload_by_week if item["week"] == 3)
    assert week_three["risk"] == "crunch"


def test_replanning_spreads_work_before_due_week():
    result = generate_plan(
        {
            "semester_start": "2026-06-22",
            "weeks": 12,
            "available_hours_per_week": 25,
            "deadlines": [_deadline(1, 6, 5, 15)],
        }
    )

    allocated_weeks = {item["week"] for item in result.study_plan}
    assert {4, 5, 6}.issubset(allocated_weeks)
    assert result.summary["peak_after_hours"] < result.summary["peak_before_hours"]
    assert all("assignment_id" in item for item in result.study_plan)
    assert result.study_plan[0]["assignment_id"] == "d1"
