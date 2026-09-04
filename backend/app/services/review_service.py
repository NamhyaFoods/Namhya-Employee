from supabase import Client
from typing import Optional, Dict, List
from datetime import datetime, date, timedelta
import logging
from app.services.score_service import ScoreService
from app.services.performance_service import PerformanceService

logger = logging.getLogger(__name__)

class ReviewService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.score_service = ScoreService()
        self.performance_service = PerformanceService(supabase)

    async def generate_monthly_review(self, user_id: str, review_month: Optional[date] = None) -> Optional[Dict]:
        """Generate a monthly review for a user"""
        try:
            if not review_month:
                review_month = date.today().replace(day=1)
            
            # Check if a review already exists for this user/month
            existing = self.supabase.table('performance_reviews')\
                .select('*')\
                .eq('user_id', user_id)\
                .eq('review_month', review_month.isoformat())\
                .execute()
            
            existing_review = existing.data[0] if existing.data else None
            
            # Get tasks for the month. This used to filter on `created_at`
            # falling inside the review month, which is wrong: a task
            # created in July but due/completed in August never showed up
            # in August's review at all, even though the employee did the
            # work in August. It also meant that as soon as the calendar
            # rolled over to a new month, every task assigned before the
            # 1st vanished from that employee's review until they got a
            # brand new task, so "Generate Reviews" would come back with
            # 0 for anyone who hadn't been assigned something fresh this
            # month - which is what was actually happening. Filtering on
            # due_date (when the work was expected to land) instead of
            # created_at (when the row happened to be inserted) is the
            # correct window for a monthly performance review.
            start_date = review_month
            end_date = review_month + timedelta(days=32)
            end_date = end_date.replace(day=1) - timedelta(days=1)
            
            tasks = self.supabase.table('tasks')\
                .select('*')\
                .eq('assigned_to', user_id)\
                .gte('due_date', start_date.isoformat())\
                .lte('due_date', end_date.isoformat())\
                .execute()
            
            if not tasks.data:
                return None
            
            total_tasks = len(tasks.data)
            completed_tasks = [t for t in tasks.data if t.get('status') == 'completed']
            total_completed = len(completed_tasks)
            
            # Calculate metrics
            completion_rate = self.score_service.calculate_completion_rate(total_tasks, total_completed)
            
            # Calculate average efficiency
            efficiencies = []
            timeliness_scores = []
            for task in tasks.data:
                if task.get('status') == 'completed' and task.get('actual_hours', 0) > 0:
                    eff = self.score_service.calculate_efficiency_score(
                        task.get('allocated_hours', 0),
                        task.get('actual_hours', 0)
                    )
                    efficiencies.append(eff)
                    
                    # Timeliness
                    if task.get('due_date') and task.get('completed_at'):
                        due_date = datetime.fromisoformat(task['due_date']).date()
                        completed_at = datetime.fromisoformat(task['completed_at']).date()
                        timeliness = self.score_service.calculate_timeliness_score(due_date, completed_at)
                        timeliness_scores.append(timeliness)
            
            avg_efficiency = sum(efficiencies) / len(efficiencies) if efficiencies else 0
            avg_timeliness = sum(timeliness_scores) / len(timeliness_scores) if timeliness_scores else 0
            
            # Quality score (default 80, can be updated by manager)
            quality_score = 80
            
            # Calculate final score
            score_result = self.score_service.calculate_score(
                avg_efficiency,
                completion_rate,
                avg_timeliness,
                quality_score
            )
            
            # Create or update review. Previously, once a review row existed
            # for a user/month it was returned as-is on every later call -
            # so "Generate Reviews" after that point silently did nothing
            # and the score stayed frozen at whatever it was the first time,
            # no matter how much task/hours/completion data changed
            # afterward. Now it always recomputes from current task data
            # and writes the result - inserting a new row the first time,
            # updating the existing one on every call after that.
            review_data = {
                'user_id': user_id,
                'review_month': review_month.isoformat(),
                'total_tasks_assigned': total_tasks,
                'total_tasks_completed': total_completed,
                'completion_rate': completion_rate,
                'average_efficiency': avg_efficiency,
                'average_timeliness_score': avg_timeliness,
                'average_quality_score': quality_score,
                'final_work_score': score_result['score'],
                'efficiency_weight_percent': self.score_service.efficiency_weight,
                'completion_weight_percent': self.score_service.completion_weight,
                'timeliness_weight_percent': self.score_service.timeliness_weight,
                'quality_weight_percent': self.score_service.quality_weight,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if existing_review:
                result = self.supabase.table('performance_reviews')\
                    .update(review_data)\
                    .eq('id', existing_review['id'])\
                    .execute()
            else:
                review_data['created_at'] = datetime.utcnow().isoformat()
                result = self.supabase.table('performance_reviews')\
                    .insert(review_data)\
                    .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error generating monthly review: {str(e)}")
            return None

    async def generate_all_monthly_reviews(self, review_month: Optional[date] = None) -> Dict:
        """Generate reviews for all active employees"""
        try:
            if not review_month:
                review_month = date.today().replace(day=1)
            
            # Get all active employees
            users = self.supabase.table('users')\
                .select('id, full_name')\
                .eq('is_active', True)\
                .neq('role', 'admin')\
                .execute()
            
            if not users.data:
                return {'generated': 0, 'failed': 0, 'details': []}
            
            generated = 0
            failed = 0
            details = []
            
            for user in users.data:
                try:
                    review = await self.generate_monthly_review(user['id'], review_month)
                    if review:
                        generated += 1
                        details.append({
                            'user_id': user['id'],
                            'user_name': user['full_name'],
                            'score': review.get('final_work_score', 0)
                        })
                    else:
                        failed += 1
                        details.append({
                            'user_id': user['id'],
                            'user_name': user['full_name'],
                            'error': 'No tasks found for this month'
                        })
                except Exception as e:
                    failed += 1
                    details.append({
                        'user_id': user['id'],
                        'user_name': user['full_name'],
                        'error': str(e)
                    })
            
            return {
                'generated': generated,
                'failed': failed,
                'total': len(users.data),
                'review_month': review_month.isoformat(),
                'details': details
            }
        except Exception as e:
            logger.error(f"Error generating all monthly reviews: {str(e)}")
            return {'generated': 0, 'failed': 0, 'error': str(e)}

    async def get_user_reviews(self, user_id: str, limit: int = 12) -> List[Dict]:
        """Get review history for a user"""
        try:
            result = self.supabase.table('performance_reviews')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('review_month', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting user reviews: {str(e)}")
            return []

    async def get_all_reviews(self, limit: int = 100) -> List[Dict]:
        """Get reviews across every employee (admin only).

        The Admin Monthly Reviews page used to call get_user_reviews with
        the logged-in admin's own id (there was no "all reviews" endpoint
        at all), which returns an empty list since admins don't have
        performance_reviews rows themselves - the page always showed zero
        reviews regardless of how many employees had actually been
        reviewed. This joins in each reviewee's full_name the same way
        task_service embeds assignee names, so the table doesn't just show
        raw user_id values.
        """
        try:
            result = self.supabase.table('performance_reviews')\
                .select('*, reviewed_user:users!user_id(full_name)')\
                .order('review_month', desc=True)\
                .limit(limit)\
                .execute()

            reviews = result.data if result.data else []
            for review in reviews:
                reviewed_user = review.pop('reviewed_user', None)
                if reviewed_user:
                    review['full_name'] = reviewed_user.get('full_name')

            return reviews
        except Exception as e:
            logger.error(f"Error getting all reviews: {str(e)}")
            return []

    async def update_review(self, review_id: str, review_data: Dict, reviewer_id: str) -> Optional[Dict]:
        """Update a review (manager only)"""
        try:
            update_data = {
                'reviewer_comments': review_data.get('reviewer_comments'),
                'reviewed_by': reviewer_id,
                'reviewed_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if review_data.get('quality_score') is not None:
                # Recalculate score if quality score changes
                # Get existing review
                existing = self.supabase.table('performance_reviews')\
                    .select('*')\
                    .eq('id', review_id)\
                    .execute()
                
                if existing.data:
                    review = existing.data[0]
                    score_result = self.score_service.calculate_score(
                        review.get('average_efficiency', 0),
                        review.get('completion_rate', 0),
                        review.get('average_timeliness_score', 0),
                        review_data['quality_score'],
                        review.get('efficiency_weight_percent'),
                        review.get('completion_weight_percent'),
                        review.get('timeliness_weight_percent'),
                        review.get('quality_weight_percent')
                    )
                    update_data['final_work_score'] = score_result['score']
                    update_data['average_quality_score'] = review_data['quality_score']
            
            result = self.supabase.table('performance_reviews')\
                .update(update_data)\
                .eq('id', review_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating review: {str(e)}")
            return None

    async def get_pending_reviews(self) -> List[Dict]:
        """Get employees who need monthly reviews"""
        try:
            result = self.supabase.rpc('get_pending_monthly_reviews').execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting pending reviews: {str(e)}")
            return []
