from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from supabase import Client
from typing import List, Optional
from app.schemas.user import UserResponse, UserUpdate, UserCreate, BulkImportResponse
from app.services.user_service import UserService
from app.db.supabase import get_supabase, get_supabase_admin
from app.dependencies import get_current_user, get_current_admin
import pandas as pd
import io
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    current_user: dict = Depends(get_current_admin)
):
    """Get all users (admin only).

    Uses the service-role client: this endpoint is already gated by
    get_current_admin, and the plain anon client never carries the
    requesting user's own session into Postgrest calls, so auth.uid()
    is always NULL there and RLS silently returns zero rows regardless
    of who is actually asking.
    """
    try:
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        users = await user_service.get_all_users(current_user['id'], role)
        return [UserResponse(**user) for user in users]
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/employees", response_model=List[UserResponse])
async def get_employees(
    current_user: dict = Depends(get_current_admin)
):
    """Get all employees (users with employee role). See get_users for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        users = await user_service.get_all_users(current_user['id'], 'employee')
        return [UserResponse(**user) for user in users]
    except Exception as e:
        logger.error(f"Error getting employees: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID. See get_users for why the service-role client is used here."""
    try:
        # Check if user has access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        user = await user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user information. See get_users for why the service-role client is used here."""
    try:
        # Check if user has access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        user = await user_service.update_user(user_id, user_data, current_user['id'])
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete (deactivate) user (admin only). See get_users for why the service-role client is used here."""
    try:
        if current_user['id'] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete yourself"
            )
        
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        result = await user_service.delete_user(user_id, current_user['id'])
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User deactivated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Activate a user (admin only). See get_users for why the service-role client is used here."""
    try:
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        result = await user_service.activate_user(user_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User activated successfully"}
    except Exception as e:
        logger.error(f"Error activating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user statistics. See get_users for why the service-role client is used here."""
    try:
        # Check access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        stats = await user_service.get_user_statistics(user_id)
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/bulk-import")
async def bulk_import_users(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin)
):
    """Bulk import users from CSV/Excel (admin only).

    Uses the service-role client since each row creates a user record on
    behalf of someone else, which RLS on `users` will otherwise reject
    (see /register in auth.py for the same fix and rationale).
    """
    try:
        contents = await file.read()
        # Parse file
        try:
            # Try CSV first
            df = pd.read_csv(io.BytesIO(contents))
        except Exception:
            # Try Excel
            df = pd.read_excel(io.BytesIO(contents))
        
        imported = 0
        failed = 0
        errors = []
        supabase = get_supabase_admin()
        user_service = UserService(supabase)
        
        for _, row in df.iterrows():
            try:
                user_data = UserCreate(
                    email=row['email'],
                    full_name=row['full_name'],
                    role=row.get('role', 'employee'),
                    department=row.get('department'),
                    designation=row.get('designation'),
                    employee_id=row.get('employee_id'),
                    phone_number=row.get('phone_number'),
                    password=row.get('password', 'TempPassword123!'),
                    confirm_password=row.get('password', 'TempPassword123!')
                )
                
                user = await user_service.create_user(user_data, current_user['id'])
                if user:
                    imported += 1
                else:
                    failed += 1
                    errors.append(f"Failed to create user: {row.get('email')}")
            except Exception as e:
                failed += 1
                errors.append(f"Error importing {row.get('email')}: {str(e)}")
        
        return BulkImportResponse(
            total_records=len(df),
            processed_records=imported,
            failed_records=failed,
            error_log=errors if errors else None,
            import_id=current_user['id']
        )
    except Exception as e:
        logger.error(f"Error in bulk import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
