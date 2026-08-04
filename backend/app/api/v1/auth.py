from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from supabase import Client
from datetime import datetime, timedelta
from app.schemas.user import UserLogin, UserCreate, UserResponse, TokenResponse
from app.services.user_service import UserService
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.auth import verify_token
from app.db.supabase import get_supabase
from app.dependencies import get_current_user, get_current_admin
import logging

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    supabase: Client = Depends(get_supabase)
):
    """Login user and return access token"""
    try:
        # Try to sign in with Supabase
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password
            })
            
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
            
            # Get user from our users table
            user_service = UserService(supabase)
            user = await user_service.get_user_by_email(login_data.email)
            
            if not user:
                # Create user record if it doesn't exist
                user_dict = {
                    'auth_user_id': auth_response.user.id,
                    'email': login_data.email,
                    'full_name': auth_response.user.user_metadata.get('full_name', login_data.email),
                    'role': auth_response.user.user_metadata.get('role', 'employee'),
                    'is_active': True,
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }
                result = supabase.table('users').insert(user_dict).execute()
                user = result.data[0] if result.data else None
            
            if not user or not user.get('is_active'):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is deactivated"
                )
            
            # Update last login
            supabase.table('users')\
                .update({'last_login': datetime.utcnow().isoformat()})\
                .eq('id', user['id'])\
                .execute()
            
            # Create access token
            access_token = create_access_token(
                data={
                    'sub': user['id'],
                    'email': user['email'],
                    'role': user['role']
                },
                expires_delta=timedelta(days=7)
            )
            
            return TokenResponse(
                access_token=access_token,
                user=UserResponse(**user)
            )
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_admin)
):
    """Register a new user (admin only)"""
    try:
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        user_service = UserService(supabase)
        user = await user_service.create_user(user_data, current_user['id'])
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists"
            )
        
        return UserResponse(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_user)
):
    """Logout user"""
    # Since we're using JWT, logout is handled on client side
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user)

@router.post("/refresh")
async def refresh_token(
    current_user: dict = Depends(get_current_user)
):
    """Refresh access token"""
    access_token = create_access_token(
        data={
            'sub': current_user['id'],
            'email': current_user['email'],
            'role': current_user['role']
        },
        expires_delta=timedelta(days=7)
    )
    
    return {
        'access_token': access_token,
        'token_type': 'bearer'
    }