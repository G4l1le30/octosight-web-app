"""dashboard.py — Pydantic schemas for dashboard analytics responses."""

from typing import Any, Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_tickets: int
    avg_risk_score: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    status_distribution: dict[str, int]
    type_distribution: dict[str, int]
    priority_distribution: dict[str, int]
    sla_breach_count: int
    open_tickets_count: int
    flag_distribution: list[dict[str, Any]]


class TrendPoint(BaseModel):
    date: str
    count: int
    high_risk: int = 0


class TimelineResponse(BaseModel):
    range: str
    points: list[TrendPoint]
