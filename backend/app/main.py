from __future__ import annotations

from pathlib import Path
import os
import sys
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from models.planner import generate_plan, result_to_dict


class DeadlinePayload(BaseModel):
    id: str
    course: str
    title: str
    due_date: str = Field(..., examples=["2026-07-18"])
    difficulty: int = Field(3, ge=1, le=5)
    estimated_hours: float | None = Field(None, ge=0.5)
    priority: str = "medium"


class PlannerPayload(BaseModel):
    semester_start: str = Field(..., examples=["2026-06-22"])
    weeks: int = Field(12, ge=1, le=24)
    available_hours_per_week: float = Field(25, ge=1)
    deadlines: list[DeadlinePayload] = Field(default_factory=list)


app = FastAPI(
    title="Cadence Planner API",
    description="Deadline collision forecasting and study-plan generation for Cadence.",
    version="0.1.0",
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "cadence-planner-api"}


@app.post("/plan")
def plan(payload: PlannerPayload) -> dict[str, Any]:
    result = generate_plan(payload.model_dump())
    return result_to_dict(result)
