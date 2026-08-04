from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.db.supabase import get_supabase
from app.core.auth import verify_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
):
    """Get current authenticated user"""
    token = credentials.credentials
    user = await verify_token(token, supabase)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_admin(
    current_user: dict = Depends(get_current_user)
):
    """Check if current user is admin or manager"""
    if current_user.get('role') not in ['admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Manager access required"
        )
    return current_user

async def get_current_employee(
    current_user: dict = Depends(get_current_user)
):
    """Check if current user is an employee"""
    if current_user.get('role') != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    return current_user