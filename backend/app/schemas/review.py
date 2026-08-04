from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class ReviewCreate(BaseModel):
    user_id: str
    review_month: date
    reviewer_comments: Optional[str] = None
    quality_score: Optional[float] = 80

class ReviewUpdate(BaseModel):
    reviewer_comments: Optional[str] = None
    quality_score: Optional[float] = None
    final_work_score: Optional[float] = None

class ReviewResponse(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str] = None
    review_month: date
    total_tasks_assigned: int
    total_tasks_completed: int
    completion_rate: float
    average_efficiency: float
    average_timeliness_score: float
    average_quality_score: float
    final_work_score: float
    efficiency_weight_percent: int
    completion_weight_percent: int
    timeliness_weight_percent: int
    quality_weight_percent: int
    reviewer_comments: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewListResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    average_score: float

class KPIResponse(BaseModel):
    id: str
    user_id: str
    review_id: Optional[str]
    kpi_name: str
    kpi_category: Optional[str]
    target_value: Optional[float]
    achieved_value: Optional[float]
    score: float
    weight_percent: int
    measurement_unit: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True