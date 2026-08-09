from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    assigned_to: str
    allocated_hours: float = Field(..., gt=0)
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    task_category: Optional[str] = None
    tags: Optional[List[str]] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    priority: Optional[TaskPriority] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    allocated_hours: Optional[float] = Field(None, gt=0)
    task_category: Optional[str] = None
    tags: Optional[List[str]] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)

class TaskResponse(TaskBase):
    id: str
    assigned_by: str
    actual_hours: float = 0
    status: TaskStatus
    progress_percentage: int = 0
    completed_at: Optional[datetime] = None
    is_overdue: bool = False
    created_at: datetime
    updated_at: datetime
    # Present on TaskResponse (not just TaskDetailResponse) because the
    # list endpoint (`GET /tasks/`, used by the Admin Tasks table) returns
    # TaskResponse, and that table needs the assignee's name per row.
    assigned_to_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class TaskDetailResponse(TaskResponse):
    assigned_by_name: Optional[str] = None
    efficiency_percentage: Optional[float] = None
    timeliness_status: Optional[str] = None
    time_logs: Optional[List] = []

class TaskStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    completion_rate: float
    avg_efficiency: float
    on_time_rate: float