from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ActivityBase(BaseModel):
    title: str = "Morning Run"
    activity_type: str = "Run"
    start_date: datetime
    distance_meters: float = Field(gt=0)
    moving_time_seconds: int = Field(gt=0)
    elapsed_time_seconds: int = Field(gt=0)
    elevation_gain_meters: float = 0.0
    average_heartrate: Optional[float] = None
    max_heartrate: Optional[float] = None
    average_cadence: Optional[float] = None
    rpe_score: Optional[int] = Field(default=None, ge=1, le=10)
    feeling: Optional[str] = None
    workout_category: Optional[str] = "easy"
    notes: Optional[str] = None

class ActivityCreate(ActivityBase):
    splits_data: Optional[List[Dict[str, Any]]] = None

class ActivityResponse(ActivityBase):
    id: int
    user_id: int
    source: str
    external_id: Optional[str] = None
    average_speed_mps: float
    average_pace_sec_km: float
    pace_formatted: str
    trimp_score: Optional[float] = None
    splits_data: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActivitySummary(BaseModel):
    total_runs: int
    total_distance_km: float
    total_duration_hours: float
    average_pace_formatted: str
    average_hr: Optional[float] = None
