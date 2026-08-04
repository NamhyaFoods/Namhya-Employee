from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

class EfficiencyResponse(BaseModel):
    task_id: str
    task_title: str
    allocated_hours: float
    actual_hours: float
    efficiency_percentage: float
    status: str

class PerformanceResponse(BaseModel):
    user_id: str
    full_name: str
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    avg_efficiency: float
    avg_timeliness_score: float
    work_score: float
    performance_category: str
    review_month: Optional[date] = None

class PerformanceTrendResponse(BaseModel):
    review_month: date
    total_tasks_completed: int
    avg_efficiency: float
    avg_timeliness_score: float
    final_work_score: float
    monthly_rank: Optional[int] = None

class ScoreCalculationRequest(BaseModel):
    efficiency: float = Field(..., ge=0, le=100)
    completion_rate: float = Field(..., ge=0, le=100)
    timeliness_score: float = Field(..., ge=0, le=100)
    quality_score: float = Field(..., ge=0, le=100)
    efficiency_weight: Optional[int] = 40
    completion_weight: Optional[int] = 25
    timeliness_weight: Optional[int] = 20
    quality_weight: Optional[int] = 15

class ScoreCalculationResponse(BaseModel):
    score: float
    score_category: str
    breakdown: dict