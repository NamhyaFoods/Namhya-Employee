from supabase import Client
from typing import Optional, Dict, List
from datetime import datetime, date, timedelta
import logging
from app.services.score_service import ScoreService

logger = logging.getLogger(__name__)

class PerformanceService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.score_service = ScoreService()

    async def calculate_efficiency(self, allocated_hours: float, actual_hours: float) -> float:
        """Calculate efficiency percentage"""
        if actual_hours <= 0 or allocated_hours <= 0:
            return 0
        efficiency = (allocated_hours / actual_hours) * 100
        return min(efficiency, 100)  # Cap at 100%

    async def get_task_efficiency(self, task_id: str) -> Optional[Dict]:
        """Get efficiency for a specific task"""
        try:
            result = self.supabase.table('tasks')\
                .select('id, title, allocated_hours, actual_hours, status')\
                .eq('id', task_id)\
                .execute()
            
            if not result.data:
                return None
            
            task = result.data[0]
            efficiency = await self.calculate_efficiency(
                task.get('allocated_hours', 0),
                task.get('actual_hours', 0)
            )
            
            return {
                'task_id': task['id'],
                'task_title': task['title'],
                'allocated_hours': task['allocated_hours'],
                'actual_hours': task['actual_hours'],
                'efficiency_percentage': efficiency,
                'status': task['status']
            }
        except Exception as e:
            logger.error(f"Error calculating task efficiency: {str(e)}")
            return None

    async def get_user_efficiency(self, user_id: str, period: str = 'month') -> Dict:
        """Get efficiency metrics for a user"""
        try:
            # Get date range
            now = datetime.now()
            if period == 'month':
                start_date = now.replace(day=1).date()
            elif period == 'quarter':
                quarter_month = (now.month - 1) // 3 * 3 + 1
                start_date = now.replace(month=quarter_month, day=1).date()
            elif period == 'year':
                start_date = now.replace(month=1, day=1).date()
            else:
                start_date = (now - timedelta(days=30)).date()
            
            # Get tasks for the period
            tasks = self.supabase.table('tasks')\
                .select('*')\
                .eq('assigned_to', user_id)\
                .gte('created_at', start_date.isoformat())\
                .execute()
            
            if not tasks.data:
                return {
                    'total_tasks': 0,
                    'completed_tasks': 0,
                    'avg_efficiency': 0,
                    'period': period,
                    'start_date': start_date.isoformat()
                }
            
            completed_tasks = [t for t in tasks.data if t.get('status') == 'completed']
            efficiencies = []
            
            for task in completed_tasks:
                if task.get('actual_hours', 0) > 0:
                    eff = await self.calculate_efficiency(
                        task.get('allocated_hours', 0),
                        task.get('actual_hours', 0)
                    )
                    efficiencies.append(eff)
            
            avg_efficiency = sum(efficiencies) / len(efficiencies) if efficiencies else 0
            
            return {
                'total_tasks': len(tasks.data),
                'completed_tasks': len(completed_tasks),
                'avg_efficiency': avg_efficiency,
                'completion_rate': (len(completed_tasks) / len(tasks.data) * 100) if tasks.data else 0,
                'period': period,
                'start_date': start_date.isoformat(),
                'end_date': now.date().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting user efficiency: {str(e)}")
            return {}

    async def get_performance_trend(self, user_id: str, months: int = 6) -> List[Dict]:
        """Get performance trend for a user.

        This used to call a get_employee_performance_history RPC function
        that was referenced here but never actually defined in any
        migration - every call raised, got caught below, and returned [].
        That's why the Admin "Performance Trends" chart was always empty
        (see performanceApi.getTrend in Admin/Performance.tsx) even for
        employees with months of review history. Querying
        performance_reviews directly avoids depending on a DB function at
        all - same source of truth the employee-side trend chart
        (MyPerformance.tsx) already builds itself from get_user_reviews.
        """
        try:
            result = self.supabase.table('performance_reviews')\
                .select('review_month, total_tasks_completed, average_efficiency, average_timeliness_score, final_work_score')\
                .eq('user_id', user_id)\
                .order('review_month', desc=True)\
                .limit(months)\
                .execute()

            rows = result.data if result.data else []
            # PerformanceTrendResponse expects avg_efficiency /
            # avg_timeliness_score, but the table columns are named
            # average_efficiency / average_timeliness_score - rename here
            # rather than changing the schema field names the rest of the
            # app (and the response model) already relies on.
            trend = [
                {
                    'review_month': row['review_month'],
                    'total_tasks_completed': row.get('total_tasks_completed', 0),
                    'avg_efficiency': row.get('average_efficiency', 0),
                    'avg_timeliness_score': row.get('average_timeliness_score', 0),
                    'final_work_score': row.get('final_work_score', 0),
                }
                for row in rows
            ]
            # Oldest-to-newest, matching what a trend line/chart expects.
            trend.reverse()
            return trend
        except Exception as e:
            logger.error(f"Error getting performance trend: {str(e)}")
            return []

    async def get_user_stats_from_view(self, user_id: str) -> Optional[Dict]:
        """Get user stats from employee_dashboard view"""
        try:
            result = self.supabase.table('employee_dashboard')\
                .select('*')\
                .eq('user_id', user_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user stats from view: {str(e)}")
            return None

    async def get_admin_dashboard_stats(self) -> Dict:
        """Get admin dashboard statistics"""
        try:
            result = self.supabase.table('admin_dashboard_summary')\
                .select('*')\
                .execute()
            
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Error getting admin dashboard stats: {str(e)}")
            return {}
