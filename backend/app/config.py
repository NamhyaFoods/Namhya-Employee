import os
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import ClassVar, Dict, List, Union

load_dotenv()

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # JWT Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-this")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # Performance Score Weights (configurable)
    EFFICIENCY_WEIGHT: int = 40
    COMPLETION_WEIGHT: int = 25
    TIMELINESS_WEIGHT: int = 20
    QUALITY_WEIGHT: int = 15
    
    # Score Thresholds
    SCORE_THRESHOLDS: ClassVar[Dict[str, float]] = {
        "excellent": 4.5,
        "good": 3.5,
        "average": 2.5,
        "below_average": 1.5
    }
    
    # App Configuration
    APP_NAME: str = "Employee Performance Dashboard"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()