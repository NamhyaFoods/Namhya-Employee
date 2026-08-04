from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    confirm_password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    auth_user_id: Optional[str] = None
    date_joined: datetime
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    profile_picture_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str]
    designation: Optional[str]
    employee_id: Optional[str]
    phone_number: Optional[str]
    date_joined: datetime
    profile_picture_url: Optional[str]
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BulkImportResponse(BaseModel):
    total_records: int
    processed_records: int
    failed_records: int
    error_log: Optional[str]
    import_id: str