from supabase import Client
from typing import Optional, Dict, List
from datetime import datetime
import logging
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_password_hash, verify_password
from app.core.auth import verify_token

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_user(self, user_data: UserCreate, admin_user_id: str) -> Optional[Dict]:
        """Create a new user"""
        try:
            # Check if user already exists
            existing = self.supabase.table('users')\
                .select('*')\
                .eq('email', user_data.email)\
                .execute()
            
            if existing.data:
                return None
            
            # Create auth user in Supabase.
            #
            # IMPORTANT: use auth.admin.create_user(), not auth.sign_up().
            # sign_up() establishes a session ON THIS CLIENT for the newly
            # created user — so any .table() calls made afterward on the
            # same client silently start running as that brand-new,
            # unprivileged user instead of the service-role key it was
            # constructed with. That's what was causing "new row violates
            # row-level security policy" even after switching this route to
            # the admin client: the insert below was, by that point, no
            # longer actually authenticated as service_role.
            #
            # auth.admin.create_user() is an admin-only action that doesn't
            # touch this client's session at all, and as a bonus lets us
            # mark the email pre-confirmed so no confirmation email is sent
            # (avoiding Supabase's email rate limit for admin-created
            # accounts entirely).
            auth_response = self.supabase.auth.admin.create_user({
                "email": user_data.email,
                "password": user_data.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user_data.full_name,
                    "role": user_data.role
                }
            })
            
            if not auth_response.user:
                raise Exception("Failed to create auth user")
            
            # Create user in our users table
            user_dict = user_data.dict(exclude={'password', 'confirm_password'})
            user_dict['auth_user_id'] = auth_response.user.id
            user_dict['created_at'] = datetime.utcnow().isoformat()
            user_dict['updated_at'] = datetime.utcnow().isoformat()
            
            result = self.supabase.table('users')\
                .insert(user_dict)\
                .execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise

    async def update_user_password(self, user_id: str, new_password: str) -> bool:
        """Admin-set a user's password directly.

        Passwords live in Supabase Auth (auth.users), not in our own
        `users` table (see create_user's note on auth.admin.create_user),
        so this has to go through auth.admin.update_user_by_id() on the
        service-role client rather than a plain table update. Requires
        the target user's auth_user_id, which we look up from our table
        since the caller only has our internal user_id.
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user or not user.get('auth_user_id'):
                return False

            self.supabase.auth.admin.update_user_by_id(
                user['auth_user_id'],
                {"password": new_password}
            )
            return True
        except Exception as e:
            logger.error(f"Error updating password for user {user_id}: {str(e)}")
            raise
        """Get user by ID"""
        try:
            result = self.supabase.table('users')\
                .select('*')\
                .eq('id', user_id)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        try:
            result = self.supabase.table('users')\
                .select('*')\
                .eq('email', email)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching user by email: {str(e)}")
            return None

    async def get_all_users(self, current_user_id: str, role_filter: Optional[str] = None) -> List[Dict]:
        """Get all users with optional role filter"""
        try:
            # TEMPORARY DIAGNOSTIC: decode which role's JWT this client is
            # actually sending on this request, to rule out the client
            # silently not being the service-role one we think it is.
            try:
                import base64, json as _json
                _headers = self.supabase.postgrest.session.headers
                _auth_header = _headers.get('Authorization', '')
                _token = _auth_header.replace('Bearer ', '')
                _payload = _token.split('.')[1]
                _payload += '=' * (-len(_payload) % 4)
                _decoded = _json.loads(base64.urlsafe_b64decode(_payload))
                logger.error(f"DEBUG get_all_users: request auth role={_decoded.get('role')}")
            except Exception as diag_e:
                logger.error(f"DEBUG get_all_users: could not decode auth header: {diag_e}")

            query = self.supabase.table('users')\
                .select('*')\
                .order('created_at', desc=True)
            
            if role_filter:
                query = query.eq('role', role_filter)
            
            result = query.execute()
            logger.error(f"DEBUG get_all_users: result.data={result.data!r}")
            return result.data if result.data else []
        except Exception as e:
            import traceback
            logger.error(f"Error fetching users: {str(e)}")
            logger.error(traceback.format_exc())
            return []

    async def update_user(self, user_id: str, user_data: UserUpdate, current_user_id: str) -> Optional[Dict]:
        """Update user information"""
        try:
            update_data = user_data.dict(exclude_unset=True)
            if not update_data:
                return None
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = self.supabase.table('users')\
                .update(update_data)\
                .eq('id', user_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            return None

    async def delete_user(self, user_id: str, current_user_id: str) -> bool:
        """Soft delete user (deactivate)"""
        try:
            result = self.supabase.table('users')\
                .update({'is_active': False, 'updated_at': datetime.utcnow().isoformat()})\
                .eq('id', user_id)\
                .execute()
            
            return bool(result.data)
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            return False

    async def activate_user(self, user_id: str) -> bool:
        """Activate user"""
        try:
            result = self.supabase.table('users')\
                .update({'is_active': True, 'updated_at': datetime.utcnow().isoformat()})\
                .eq('id', user_id)\
                .execute()
            return bool(result.data)
        except Exception as e:
            logger.error(f"Error activating user: {str(e)}")
            return False

    async def get_user_statistics(self, user_id: str) -> Dict:
        """Get user statistics"""
        try:
            # Get task stats
            task_result = self.supabase.table('tasks')\
                .select('status')\
                .eq('assigned_to', user_id)\
                .execute()
            
            total_tasks = len(task_result.data) if task_result.data else 0
            completed_tasks = len([t for t in task_result.data if t.get('status') == 'completed']) if task_result.data else 0
            
            # Get performance stats
            perf_result = self.supabase.table('performance_reviews')\
                .select('final_work_score')\
                .eq('user_id', user_id)\
                .order('review_month', desc=True)\
                .limit(1)\
                .execute()
            
            latest_score = perf_result.data[0].get('final_work_score', 0) if perf_result.data else 0
            
            return {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
                'latest_score': latest_score,
                'tasks_count': total_tasks
            }
        except Exception as e:
            logger.error(f"Error getting user statistics: {str(e)}")
            return {}
