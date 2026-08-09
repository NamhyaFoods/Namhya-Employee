from supabase import Client
from typing import Optional, Dict, List, Any
from datetime import datetime, date
import logging
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatus

logger = logging.getLogger(__name__)

class TaskService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_task(self, task_data: TaskCreate, assigned_by: str) -> Optional[Dict]:
        """Create a new task"""
        try:
            # Use mode='json' so date/datetime fields (start_date, due_date)
            # are serialized to ISO strings rather than left as raw Python
            # date objects, which the Supabase client can't JSON-encode
            # ("Object of type date is not JSON serializable").
            task_dict = task_data.model_dump(mode='json')
            task_dict['assigned_by'] = assigned_by
            task_dict['status'] = 'todo'
            task_dict['progress_percentage'] = 0
            task_dict['actual_hours'] = 0
            task_dict['created_at'] = datetime.utcnow().isoformat()
            task_dict['updated_at'] = datetime.utcnow().isoformat()
            
            result = self.supabase.table('tasks')\
                .insert(task_dict)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            raise

    @staticmethod
    def _flatten_assignee_names(task: Dict) -> Dict:
        """Flatten the nested Supabase join objects into the flat string
        fields the response schemas (and the frontend) actually read.

        get_all_tasks/get_task_by_id select a joined `assigned_to_user:
        users!assigned_to(full_name, ...)` object, but TaskResponse /
        TaskDetailResponse expect a plain `assigned_to_name` string. Since
        the nested shape never matched the flat field name, every response
        left `assigned_to_name` unset — the Admin Tasks table and task
        detail views always showed "N/A" for the assignee regardless of
        who a task was actually assigned to.
        """
        assigned_to_user = task.pop('assigned_to_user', None)
        if assigned_to_user:
            task['assigned_to_name'] = assigned_to_user.get('full_name')

        assigned_by_user = task.pop('assigned_by_user', None)
        if assigned_by_user:
            task['assigned_by_name'] = assigned_by_user.get('full_name')

        return task

    async def get_task_by_id(self, task_id: str, user_id: str) -> Optional[Dict]:
        """Get task by ID with access control"""
        try:
            result = self.supabase.table('tasks')\
                .select('*, assigned_to_user:users!assigned_to(full_name), assigned_by_user:users!assigned_by(full_name)')\
                .eq('id', task_id)\
                .execute()
            
            if not result.data:
                return None
            
            task = self._flatten_assignee_names(result.data[0])
            return task
        except Exception as e:
            logger.error(f"Error fetching task: {str(e)}")
            return None

    async def get_user_tasks(self, user_id: str, status_filter: Optional[str] = None) -> List[Dict]:
        """Get tasks assigned to a user"""
        try:
            query = self.supabase.table('tasks')\
                .select('*')\
                .eq('assigned_to', user_id)\
                .order('created_at', desc=True)
            
            if status_filter:
                query = query.eq('status', status_filter)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching user tasks: {str(e)}")
            return []

    async def get_all_tasks(self, user_id: str, filters: Optional[Dict] = None) -> List[Dict]:
        """Get all tasks (admin/manager only)"""
        try:
            query = self.supabase.table('tasks')\
                .select('*, assigned_to_user:users!assigned_to(full_name, email)')\
                .order('created_at', desc=True)
            
            if filters:
                if filters.get('status'):
                    query = query.eq('status', filters['status'])
                if filters.get('assigned_to'):
                    query = query.eq('assigned_to', filters['assigned_to'])
                if filters.get('priority'):
                    query = query.eq('priority', filters['priority'])
                if filters.get('is_overdue'):
                    query = query.eq('is_overdue', filters['is_overdue'])
            
            result = query.execute()
            tasks = result.data if result.data else []
            return [self._flatten_assignee_names(t) for t in tasks]
        except Exception as e:
            logger.error(f"Error fetching all tasks: {str(e)}")
            return []

    async def update_task(self, task_id: str, task_data: TaskUpdate, user_id: str) -> Optional[Dict]:
        """Update task information"""
        try:
            update_data = task_data.dict(exclude_unset=True)
            if not update_data:
                return None
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            # If task is being completed, set completed_at
            if task_data.status == 'completed':
                update_data['completed_at'] = datetime.utcnow().isoformat()
            
            result = self.supabase.table('tasks')\
                .update(update_data)\
                .eq('id', task_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating task: {str(e)}")
            return None

    async def update_task_status(self, task_id: str, status: TaskStatus, progress: Optional[int] = None, user_id: str = None) -> Optional[Dict]:
        """Update task status"""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if progress is not None:
                update_data['progress_percentage'] = progress
            
            if status == 'completed':
                update_data['completed_at'] = datetime.utcnow().isoformat()
            elif status != 'completed':
                update_data['completed_at'] = None
            
            result = self.supabase.table('tasks')\
                .update(update_data)\
                .eq('id', task_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating task status: {str(e)}")
            return None

    async def delete_task(self, task_id: str, user_id: str) -> bool:
        """Delete a task"""
        try:
            result = self.supabase.table('tasks')\
                .delete()\
                .eq('id', task_id)\
                .execute()
            return bool(result.data)
        except Exception as e:
            logger.error(f"Error deleting task: {str(e)}")
            return False

    async def get_task_statistics(self, user_id: str) -> Dict:
        """Get task statistics for a user"""
        try:
            tasks = await self.get_user_tasks(user_id)
            
            total = len(tasks)
            completed = len([t for t in tasks if t.get('status') == 'completed'])
            in_progress = len([t for t in tasks if t.get('status') == 'in_progress'])
            todo = len([t for t in tasks if t.get('status') == 'todo'])
            pending = in_progress + todo
            overdue = len([t for t in tasks if t.get('is_overdue') == True and t.get('status') != 'completed'])
            
            # Calculate efficiency for completed tasks
            efficiencies = []
            for t in tasks:
                if t.get('status') == 'completed' and t.get('actual_hours', 0) > 0:
                    eff = min((t.get('allocated_hours', 0) / t.get('actual_hours', 1)) * 100, 100)
                    efficiencies.append(eff)
            
            avg_efficiency = sum(efficiencies) / len(efficiencies) if efficiencies else 0
            
            return {
                'total_tasks': total,
                'completed_tasks': completed,
                'pending_tasks': pending,
                'in_progress_tasks': in_progress,
                'todo_tasks': todo,
                'overdue_tasks': overdue,
                'completion_rate': (completed / total * 100) if total > 0 else 0,
                'avg_efficiency': avg_efficiency,
                'on_time_rate': 0  # Will be calculated from timeliness
            }
        except Exception as e:
            logger.error(f"Error getting task statistics: {str(e)}")
            return {}

    async def bulk_import_tasks(self, tasks_data: List[Dict], assigned_by: str) -> Dict:
        """Bulk import tasks"""
        try:
            imported = 0
            failed = 0
            errors = []
            
            for task_data in tasks_data:
                try:
                    # Validate required fields
                    if not task_data.get('title') or not task_data.get('assigned_to'):
                        failed += 1
                        errors.append(f"Missing required fields in task: {task_data.get('title', 'Unknown')}")
                        continue
                    
                    # Create task
                    task_dict = {
                        'title': task_data.get('title'),
                        'description': task_data.get('description', ''),
                        'assigned_to': task_data.get('assigned_to'),
                        'assigned_by': assigned_by,
                        'allocated_hours': float(task_data.get('allocated_hours', 1)),
                        'priority': task_data.get('priority', 'medium'),
                        'status': 'todo',
                        'progress_percentage': 0,
                        'actual_hours': 0,
                        'start_date': task_data.get('start_date'),
                        'due_date': task_data.get('due_date'),
                        'task_category': task_data.get('category'),
                        'created_at': datetime.utcnow().isoformat(),
                        'updated_at': datetime.utcnow().isoformat()
                    }
                    
                    result = self.supabase.table('tasks')\
                        .insert(task_dict)\
                        .execute()
                    
                    if result.data:
                        imported += 1
                    else:
                        failed += 1
                        errors.append(f"Failed to import task: {task_data.get('title', 'Unknown')}")
                        
                except Exception as e:
                    failed += 1
                    errors.append(f"Error importing task {task_data.get('title', 'Unknown')}: {str(e)}")
            
            return {
                'imported': imported,
                'failed': failed,
                'total': imported + failed,
                'errors': errors
            }
        except Exception as e:
            logger.error(f"Error in bulk import: {str(e)}")
            raise