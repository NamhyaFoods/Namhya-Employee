from supabase import Client
from typing import Optional, Dict, List
from datetime import datetime, date, timedelta
import logging
from app.schemas.time_log import TimeLogCreate, TimeLogUpdate

logger = logging.getLogger(__name__)

class TimeLogService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_time_log(self, log_data: TimeLogCreate, user_id: str) -> Optional[Dict]:
        """Create a new time log entry"""
        try:
            log_dict = log_data.dict()
            log_dict['user_id'] = user_id
            log_dict['created_at'] = datetime.utcnow().isoformat()
            log_dict['updated_at'] = datetime.utcnow().isoformat()
            
            if not log_dict.get('log_date'):
                log_dict['log_date'] = date.today().isoformat()
            else:
                # log_data.dict() leaves log_date as a native datetime.date
                # object (Pydantic parses the incoming string into one).
                # Supabase's insert() has to JSON-serialize this dict to
                # send it as the request body, and a raw `date` object isn't
                # JSON-serializable - it raised a TypeError here every time,
                # just previously masked because this endpoint always failed
                # earlier with "Task not found" (see the get_supabase_admin
                # fix in time_logs.py) before ever reaching this insert.
                log_dict['log_date'] = log_dict['log_date'].isoformat()
            
            result = self.supabase.table('time_logs')\
                .insert(log_dict)\
                .execute()
            
            if result.data:
                # Update task actual hours
                await self._update_task_actual_hours(log_data.task_id)
                return result.data[0]
            
            return None
        except Exception as e:
            logger.error(f"Error creating time log: {str(e)}")
            raise

    async def get_time_logs_by_task(self, task_id: str, user_id: str) -> List[Dict]:
        """Get all time logs for a task"""
        try:
            result = self.supabase.table('time_logs')\
                .select('*')\
                .eq('task_id', task_id)\
                .order('log_date', desc=True)\
                .execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching time logs: {str(e)}")
            return []

    async def get_time_logs_by_user(self, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict]:
        """Get all time logs for a user with optional date range"""
        try:
            query = self.supabase.table('time_logs')\
                .select('*, tasks(title)')\
                .eq('user_id', user_id)\
                .order('log_date', desc=True)
            
            if start_date:
                query = query.gte('log_date', start_date.isoformat())
            if end_date:
                query = query.lte('log_date', end_date.isoformat())
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching user time logs: {str(e)}")
            return []

    async def update_time_log(self, log_id: str, log_data: TimeLogUpdate, user_id: str) -> Optional[Dict]:
        """Update a time log entry"""
        try:
            update_data = log_data.dict(exclude_unset=True)
            if not update_data:
                return None
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            if update_data.get('log_date'):
                # Same JSON-serialization issue as create_time_log - a raw
                # datetime.date object isn't serializable by Supabase's insert/update.
                update_data['log_date'] = update_data['log_date'].isoformat()
            
            # Get task_id before update
            existing = self.supabase.table('time_logs')\
                .select('task_id')\
                .eq('id', log_id)\
                .execute()
            
            result = self.supabase.table('time_logs')\
                .update(update_data)\
                .eq('id', log_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if result.data and existing.data:
                # Update task actual hours
                await self._update_task_actual_hours(existing.data[0]['task_id'])
                return result.data[0]
            
            return None
        except Exception as e:
            logger.error(f"Error updating time log: {str(e)}")
            return None

    async def delete_time_log(self, log_id: str, user_id: str) -> bool:
        """Delete a time log entry"""
        try:
            # Get task_id before deletion
            existing = self.supabase.table('time_logs')\
                .select('task_id')\
                .eq('id', log_id)\
                .execute()
            
            result = self.supabase.table('time_logs')\
                .delete()\
                .eq('id', log_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if result.data and existing.data:
                # Update task actual hours
                await self._update_task_actual_hours(existing.data[0]['task_id'])
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error deleting time log: {str(e)}")
            return False

    async def _update_task_actual_hours(self, task_id: str):
        """Update task's actual hours (and derived progress_percentage) from time logs.

        progress_percentage was never being touched anywhere in this flow -
        the only writers of it were the admin edit-task form and the (unused)
        status-update endpoint, so for any task whose progress was being
        driven by logged hours it just sat at 0 forever, no matter how much
        time was logged. This mirrors the actual_hours calculation above:
        progress = hours logged / allocated hours, capped at 100, and it's
        skipped for tasks already 'completed' or 'cancelled' so it can't
        knock a finished task's progress back down/up from a stale log edit.
        """
        try:
            # Sum all time logs for this task
            logs = self.supabase.table('time_logs')\
                .select('hours_spent')\
                .eq('task_id', task_id)\
                .execute()
            
            total_hours = sum(log.get('hours_spent', 0) for log in logs.data) if logs.data else 0
            
            update_payload = {
                'actual_hours': total_hours,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Need allocated_hours (and current status) to derive progress
            task_result = self.supabase.table('tasks')\
                .select('allocated_hours, status')\
                .eq('id', task_id)\
                .execute()
            
            if task_result.data:
                task = task_result.data[0]
                allocated_hours = task.get('allocated_hours') or 0
                status = task.get('status')
                
                if status not in ('completed', 'cancelled') and allocated_hours > 0:
                    progress = round((total_hours / allocated_hours) * 100)
                    update_payload['progress_percentage'] = max(0, min(progress, 100))
            
            # Update task
            self.supabase.table('tasks')\
                .update(update_payload)\
                .eq('id', task_id)\
                .execute()
        except Exception as e:
            logger.error(f"Error updating task actual hours: {str(e)}")

    async def get_time_log_summary(self, user_id: str, period: str = 'month') -> Dict:
        """Get time log summary for a user"""
        try:
            # Get date range
            now = datetime.now()
            if period == 'month':
                start_date = now.replace(day=1).date()
            elif period == 'week':
                start_date = (now - timedelta(days=7)).date()
            else:
                start_date = (now - timedelta(days=30)).date()
            
            logs = await self.get_time_logs_by_user(user_id, start_date, now.date())
            
            total_hours = sum(log.get('hours_spent', 0) for log in logs)
            
            # Group by task
            task_hours = {}
            for log in logs:
                task_id = log.get('task_id')
                task_hours[task_id] = task_hours.get(task_id, 0) + log.get('hours_spent', 0)
            
            return {
                'total_hours': total_hours,
                'log_count': len(logs),
                'task_count': len(task_hours),
                'average_hours_per_day': total_hours / len(set(log.get('log_date') for log in logs)) if logs else 0,
                'period': period,
                'start_date': start_date.isoformat(),
                'end_date': now.date().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting time log summary: {str(e)}")
            return {}