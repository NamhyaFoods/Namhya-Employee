from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional
from datetime import date
from app.schemas.time_log import TimeLogCreate, TimeLogUpdate, TimeLogResponse, TimeLogSummaryResponse
from app.services.time_log_service import TimeLogService
from app.services.task_service import TaskService
# Every other router (tasks, users, reviews) fetches its Supabase client via
# get_supabase_admin() - the service-role client that bypasses Row Level
# Security - and does its own manual permission checks in Python (see the
# current_user['id'] != task['assigned_to'] checks below). This file used to
# be the one exception, injecting get_supabase (the anon-key client) instead.
# That client has no per-request user session attached to it, so any RLS
# policy on a table sees no authenticated user and silently returns zero
# rows. In practice that meant every lookup here - including the task
# existence check inside get_task_time_logs/create_time_log - came back
# empty, which the handlers correctly (from their own perspective) reported
# as 404 "Task not found", even though the task existed and the exact same
# lookup succeeded through tasks.py's endpoints. Switched to
# get_supabase_admin() to match the rest of the codebase.
from app.db.supabase import get_supabase_admin
from app.dependencies import get_current_user, get_current_admin
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=TimeLogResponse)
async def create_time_log(
    log_data: TimeLogCreate,
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Create a time log entry"""
    try:
        # Check if user has access to the task
        task_service = TaskService(supabase)
        task = await task_service.get_task_by_id(log_data.task_id, current_user['id'])
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user is assigned to the task or is admin
        if current_user['id'] != task['assigned_to'] and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        time_log_service = TimeLogService(supabase)
        log = await time_log_service.create_time_log(log_data, current_user['id'])
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create time log"
            )
        
        return TimeLogResponse(**log)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating time log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/task/{task_id}", response_model=List[TimeLogResponse])
async def get_task_time_logs(
    task_id: str,
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get time logs for a task"""
    try:
        # Check access
        task_service = TaskService(supabase)
        task = await task_service.get_task_by_id(task_id, current_user['id'])
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        if current_user['id'] != task['assigned_to'] and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        time_log_service = TimeLogService(supabase)
        logs = await time_log_service.get_time_logs_by_task(task_id, current_user['id'])
        
        return [TimeLogResponse(**log) for log in logs]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task time logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-logs", response_model=List[TimeLogResponse])
async def get_my_time_logs(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's time logs"""
    try:
        time_log_service = TimeLogService(supabase)
        logs = await time_log_service.get_time_logs_by_user(
            current_user['id'],
            start_date,
            end_date
        )
        
        return [TimeLogResponse(**log) for log in logs]
    except Exception as e:
        logger.error(f"Error getting my time logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=List[TimeLogResponse])
async def get_user_time_logs(
    user_id: str,
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_admin)
):
    """Get time logs for a specific user (admin only)"""
    try:
        time_log_service = TimeLogService(supabase)
        logs = await time_log_service.get_time_logs_by_user(
            user_id,
            start_date,
            end_date
        )
        
        return [TimeLogResponse(**log) for log in logs]
    except Exception as e:
        logger.error(f"Error getting user time logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{log_id}", response_model=TimeLogResponse)
async def update_time_log(
    log_id: str,
    log_data: TimeLogUpdate,
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Update a time log entry"""
    try:
        time_log_service = TimeLogService(supabase)
        log = await time_log_service.update_time_log(log_id, log_data, current_user['id'])
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time log not found or access denied"
            )
        
        return TimeLogResponse(**log)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating time log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{log_id}")
async def delete_time_log(
    log_id: str,
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Delete a time log entry"""
    try:
        time_log_service = TimeLogService(supabase)
        result = await time_log_service.delete_time_log(log_id, current_user['id'])
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time log not found or access denied"
            )
        
        return {"message": "Time log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting time log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-logs/summary")
async def get_my_time_log_summary(
    period: str = Query("month", description="Period: day, week, month, year"),
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get time log summary for current user"""
    try:
        time_log_service = TimeLogService(supabase)
        summary = await time_log_service.get_time_log_summary(current_user['id'], period)
        
        return summary
    except Exception as e:
        logger.error(f"Error getting time log summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )