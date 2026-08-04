from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum

class LogType(str, Enum):
    MANUAL = "manual"
    TIMER = "timer"
    BULK = "bulk"

class TimeLogBase(BaseModel):
    task_id: str
    hours_spent: float = Field(..., gt=0)
    log_date: Optional[date] = None
    description: Optional[str] = None
    is_billable: bool = True
    log_type: LogType = LogType.MANUAL

class TimeLogCreate(TimeLogBase):
    pass

class TimeLogUpdate(BaseModel):
    hours_spent: Optional[float] = Field(None, gt=0)
    log_date: Optional[date] = None
    description: Optional[str] = None
    is_billable: Optional[bool] = None

class TimeLogResponse(TimeLogBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    task_title: Optional[str] = None
    
    class Config:
        from_attributes = True

class TimeLogSummaryResponse(BaseModel):
    task_id: str
    total_hours: float
    log_count: int
    last_log_date: Optional[date] = None
    average_hours_per_log: float