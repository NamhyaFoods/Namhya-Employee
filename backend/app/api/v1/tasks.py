from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskDetailResponse, TaskStatsResponse, TaskStatusUpdate
from app.services.task_service import TaskService
from app.services.time_log_service import TimeLogService
from app.db.supabase import get_supabase, get_supabase_admin
from app.dependencies import get_current_user, get_current_admin
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create a new task (admin/manager only).

    Uses the service-role client: this endpoint is already gated by
    get_current_admin, and the anon client never carries the requesting
    user's own session into Postgrest calls, so auth.uid() is always NULL
    there and RLS blocks the insert regardless of who is actually asking.
    """
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        task = await task_service.create_task(task_data, current_user['id'])
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create task"
            )
        
        return TaskResponse(**task)
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    current_user: dict = Depends(get_current_user)
):
    """Get tasks (filtered by user role). See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        
        # If admin/manager, get all tasks with filters
        if current_user['role'] in ['admin', 'manager']:
            filters = {}
            if status_filter:
                filters['status'] = status_filter
            if assigned_to:
                filters['assigned_to'] = assigned_to
            if priority:
                filters['priority'] = priority
            
            tasks = await task_service.get_all_tasks(current_user['id'], filters)
        else:
            # Employees see only their tasks
            tasks = await task_service.get_user_tasks(current_user['id'], status_filter)
        
        return [TaskResponse(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error getting tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user)
):
    """Get tasks assigned to current user. See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        tasks = await task_service.get_user_tasks(current_user['id'], status_filter)
        return [TaskResponse(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error getting my tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}", response_model=TaskDetailResponse)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get task by ID. See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        task = await task_service.get_task_by_id(task_id, current_user['id'])
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check access
        if current_user['id'] != task['assigned_to'] and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get time logs
        time_log_service = TimeLogService(supabase)
        time_logs = await time_log_service.get_time_logs_by_task(task_id, current_user['id'])
        
        task['time_logs'] = time_logs
        
        return TaskDetailResponse(**task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update task. See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        
        # Check if task exists and user has access
        task = await task_service.get_task_by_id(task_id, current_user['id'])
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check access
        if current_user['id'] != task['assigned_to'] and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        updated_task = await task_service.update_task(task_id, task_data, current_user['id'])
        if not updated_task:
            # Either the request contained no actual field changes, or the
            # update ran but the row wasn't found/returned. Re-fetch and
            # return the current task instead of crashing on
            # TaskResponse(**None).
            updated_task = await task_service.get_task_by_id(task_id, current_user['id'])
            if not updated_task:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )
        return TaskResponse(**updated_task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    status_data: TaskStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update task status. See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        
        # Check if task exists and user has access
        task = await task_service.get_task_by_id(task_id, current_user['id'])
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check access
        if current_user['id'] != task['assigned_to'] and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        updated_task = await task_service.update_task_status(
            task_id, 
            status_data.status, 
            status_data.progress_percentage,
            current_user['id']
        )
        
        return TaskResponse(**updated_task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete task (admin only). See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        result = await task_service.delete_task(task_id, current_user['id'])
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/my-tasks/stats", response_model=TaskStatsResponse)
async def get_my_task_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get task statistics for current user. See create_task for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        task_service = TaskService(supabase)
        stats = await task_service.get_task_statistics(current_user['id'])
        return TaskStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting task stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )