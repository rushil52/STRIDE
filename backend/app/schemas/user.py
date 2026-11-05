from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    max_heart_rate: Optional[int] = Field(default=190, ge=120, le=240)
    resting_heart_rate: Optional[int] = Field(default=55, ge=30, le=100)
    weekly_mileage_goal_km: Optional[float] = Field(default=30.0, ge=0)
    target_race_distance: Optional[str] = "5K"
    target_race_date: Optional[datetime] = None
    target_time_seconds: Optional[int] = None
    experience_level: Optional[str] = "intermediate"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    max_heart_rate: Optional[int] = None
    resting_heart_rate: Optional[int] = None
    weekly_mileage_goal_km: Optional[float] = None
    target_race_distance: Optional[str] = None
    target_race_date: Optional[datetime] = None
    target_time_seconds: Optional[int] = None
    experience_level: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    strava_connected: bool = False
    strava_athlete_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
