from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from supabase import Client
from typing import List, Optional
from app.schemas.user import UserResponse, UserUpdate, UserCreate, BulkImportResponse
from app.services.user_service import UserService
from app.db.supabase import get_supabase
from app.dependencies import get_current_user, get_current_admin
import pandas as pd
import io
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_admin)
):
    """Get all users (admin only)"""
    try:
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_admin)
):
    """Get all employees (users with employee role)"""
    try:
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        # Check if user has access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    """Update user information"""
    try:
        # Check if user has access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_admin)
):
    """Delete (deactivate) user (admin only)"""
    try:
        if current_user['id'] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete yourself"
            )
        
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_admin)
):
    """Activate a user (admin only)"""
    try:
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    """Get user statistics"""
    try:
        # Check access
        if current_user['id'] != user_id and current_user['role'] not in ['admin', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
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
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_admin)
):
    """Bulk import users from CSV/Excel (admin only)"""
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