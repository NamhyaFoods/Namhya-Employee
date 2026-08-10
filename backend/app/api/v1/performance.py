from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional
from app.schemas.performance import (
    PerformanceResponse, 
    EfficiencyResponse, 
    PerformanceTrendResponse,
    ScoreCalculationRequest,
    ScoreCalculationResponse
)
from app.services.performance_service import PerformanceService
from app.services.score_service import ScoreService
from app.services.review_service import ReviewService
from app.db.supabase import get_supabase_admin
# All endpoints in this file now use the service-role client (bypasses RLS).
# my-performance, user/{user_id}, efficiency/task/{task_id}, trend/{user_id},
# and leaderboard were previously injected with get_supabase (the anon-key
# client), which Row Level Security applies to. That client has no
# per-request user session attached, so RLS policies saw no authenticated
# user and silently returned zero rows for every query - which is why
# efficiency, completion rate, and score all showed up empty/zero. Only
# /dashboard/admin was already using get_supabase_admin() correctly. See the
# matching fix and longer explanation in time_logs.py.
from app.dependencies import get_current_user, get_current_admin
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/my-performance")
async def get_my_performance(
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's performance metrics"""
    try:
        performance_service = PerformanceService(supabase)
        
        # Get dashboard stats from view
        stats = await performance_service.get_user_stats_from_view(current_user['id'])
        
        if not stats:
            # Calculate manually
            efficiency = await performance_service.get_user_efficiency(current_user['id'])
            stats = {
                'user_id': current_user['id'],
                'full_name': current_user['full_name'],
                'total_tasks': efficiency.get('total_tasks', 0),
                'completed_tasks': efficiency.get('completed_tasks', 0),
                'completion_rate': efficiency.get('completion_rate', 0),
                'avg_efficiency': efficiency.get('avg_efficiency', 0),
                'avg_timeliness_score': 0,
                'work_score': 0,
                'performance_category': 'Not Rated'
            }
            
            # Get latest review score
            review_service = ReviewService(supabase)
            reviews = await review_service.get_user_reviews(current_user['id'], 1)
            if reviews:
                stats['work_score'] = reviews[0].get('final_work_score', 0)
                score_service = ScoreService()
                stats['performance_category'] = score_service._get_score_category(stats['work_score'])
                stats['avg_timeliness_score'] = reviews[0].get('average_timeliness_score', 0)
        
        return PerformanceResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting my performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=PerformanceResponse)
async def get_user_performance(
    user_id: str,
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get performance metrics for a specific user"""
    try:
        # Check access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        performance_service = PerformanceService(supabase)
        
        stats = await performance_service.get_user_stats_from_view(user_id)
        
        if not stats:
            efficiency = await performance_service.get_user_efficiency(user_id)
            stats = {
                'user_id': user_id,
                'full_name': '',
                'total_tasks': efficiency.get('total_tasks', 0),
                'completed_tasks': efficiency.get('completed_tasks', 0),
                'completion_rate': efficiency.get('completion_rate', 0),
                'avg_efficiency': efficiency.get('avg_efficiency', 0),
                'avg_timeliness_score': 0,
                'work_score': 0,
                'performance_category': 'Not Rated'
            }
            
            # Get user name
            user_result = supabase.table('users')\
                .select('full_name')\
                .eq('id', user_id)\
                .execute()
            
            if user_result.data:
                stats['full_name'] = user_result.data[0].get('full_name', '')
        
        return PerformanceResponse(**stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/efficiency/task/{task_id}")
async def get_task_efficiency(
    task_id: str,
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get efficiency for a specific task"""
    try:
        performance_service = PerformanceService(supabase)
        efficiency = await performance_service.get_task_efficiency(task_id)
        
        if not efficiency:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return EfficiencyResponse(**efficiency)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task efficiency: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/trend/{user_id}", response_model=List[PerformanceTrendResponse])
async def get_performance_trend(
    user_id: str,
    months: int = Query(6, description="Number of months to show"),
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_user)
):
    """Get performance trend for a user"""
    try:
        # Check access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        performance_service = PerformanceService(supabase)
        trend = await performance_service.get_performance_trend(user_id, months)
        
        return [PerformanceTrendResponse(**item) for item in trend]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting performance trend: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/dashboard/admin")
async def get_admin_dashboard(
    current_user: dict = Depends(get_current_admin)
):
    """Get admin dashboard statistics.

    Uses the service-role client (see users.py get_users for the same
    reasoning): this is already gated by get_current_admin, but the plain
    anon client never carries the requesting user's session into Postgrest
    calls, so auth.uid() is NULL and RLS silently returns zero rows/counts
    for both the admin_dashboard_summary view and the manual fallback
    queries below — which is why every card on the dashboard showed 0 even
    though employees and tasks clearly exist (visible on pages that already
    use the admin client).
    """
    try:
        supabase = get_supabase_admin()
        performance_service = PerformanceService(supabase)
        stats = await performance_service.get_admin_dashboard_stats()
        
        if not stats:
            # Calculate manually
            from datetime import datetime, timezone

            # Not filtered by role='employee': this mirrors the Employees
            # page (usersApi.getAll(), no role filter), which lists every
            # active user (admin/manager/employee) — kept consistent so
            # this card's number matches what's visible on that page.
            total_employees = supabase.table('users')\
                .select('id', count='exact')\
                .eq('is_active', True)\
                .execute()

            total_managers = supabase.table('users')\
                .select('id', count='exact')\
                .eq('is_active', True)\
                .eq('role', 'manager')\
                .execute()

            active_tasks = supabase.table('tasks')\
                .select('id', count='exact')\
                .neq('status', 'completed')\
                .neq('status', 'cancelled')\
                .execute()

            today = datetime.now(timezone.utc).date()
            month_start = today.replace(day=1).isoformat()

            tasks_completed_this_month = supabase.table('tasks')\
                .select('id', count='exact')\
                .eq('status', 'completed')\
                .gte('completed_at', month_start)\
                .execute()

            overdue_tasks = supabase.table('tasks')\
                .select('id', count='exact')\
                .lt('due_date', today.isoformat())\
                .neq('status', 'completed')\
                .neq('status', 'cancelled')\
                .execute()

            stats = {
                'total_employees': total_employees.count,
                'active_tasks': active_tasks.count,
                'total_managers': total_managers.count,
                'tasks_completed_this_month': tasks_completed_this_month.count,
                'tasks_todo': 0,
                'tasks_in_progress': 0,
                'tasks_in_review': 0,
                'tasks_on_hold': 0,
                'tasks_cancelled': 0,
                'overdue_tasks': overdue_tasks.count,
                'avg_efficiency_this_month': 0,
                'avg_work_score_last_month': 0
            }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting admin dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/calculate-score", response_model=ScoreCalculationResponse)
async def calculate_score(
    data: ScoreCalculationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Calculate work score with given parameters"""
    try:
        score_service = ScoreService()
        result = score_service.calculate_score(
            data.efficiency,
            data.completion_rate,
            data.timeliness_score,
            data.quality_score,
            data.efficiency_weight,
            data.completion_weight,
            data.timeliness_weight,
            data.quality_weight
        )
        
        return ScoreCalculationResponse(**result)
    except Exception as e:
        logger.error(f"Error calculating score: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/leaderboard")
async def get_performance_leaderboard(
    limit: int = Query(10, description="Number of top performers"),
    supabase: Client = Depends(get_supabase_admin),
    current_user: dict = Depends(get_current_admin)
):
    """Get performance leaderboard (admin only)"""
    try:
        # Get latest month reviews
        # Pull a wider window of recent reviews so grouping-by-user still
        # gives us enough distinct users to rank, then slice to `limit`
        # after sorting (the previous version limited the raw query itself,
        # which could return fewer than `limit` distinct users).
        result = supabase.table('performance_reviews')\
            .select('*, users!performance_reviews_user_id_fkey(full_name, email, department)')\
            .order('review_month', desc=True)\
            .limit(max(limit * 10, 100))\
            .execute()
        
        if not result.data:
            return []
        
        # Group by user and get latest
        user_scores = {}
        for review in result.data:
            user_id = review['user_id']
            if user_id not in user_scores or review['review_month'] > user_scores[user_id]['review_month']:
                user_scores[user_id] = review
        
        # Sort by score
        sorted_users = sorted(user_scores.values(), key=lambda x: x.get('final_work_score', 0), reverse=True)
        
        # Format response
        leaderboard = []
        for rank, user in enumerate(sorted_users[:limit], 1):
            leaderboard.append({
                'rank': rank,
                'user_id': user['user_id'],
                'full_name': user.get('users', {}).get('full_name', 'Unknown'),
                'department': user.get('users', {}).get('department', ''),
                'score': user.get('final_work_score', 0),
                'review_month': user['review_month'],
                'completion_rate': user.get('completion_rate', 0),
                'avg_efficiency': user.get('average_efficiency', 0)
            })
        
        return leaderboard
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )