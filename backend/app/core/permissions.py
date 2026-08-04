from typing import Dict, List
from functools import wraps
from fastapi import HTTPException, status

def check_role(user: Dict, allowed_roles: List[str]) -> bool:
    """Check if user has one of the allowed roles"""
    return user.get('role') in allowed_roles

def require_roles(allowed_roles: List[str]):
    """Decorator to require specific roles"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )
            
            if not check_role(current_user, allowed_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required roles: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Helper functions for permission checks
def can_manage_users(user: Dict) -> bool:
    """Check if user can manage other users"""
    return user.get('role') in ['admin', 'manager']

def can_assign_tasks(user: Dict) -> bool:
    """Check if user can assign tasks"""
    return user.get('role') in ['admin', 'manager']

def can_view_all_tasks(user: Dict) -> bool:
    """Check if user can view all tasks"""
    return user.get('role') in ['admin', 'manager']

def can_view_all_performance(user: Dict) -> bool:
    """Check if user can view all performance data"""
    return user.get('role') in ['admin', 'manager']