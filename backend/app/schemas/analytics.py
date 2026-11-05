from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DailyMetricResponse(BaseModel):
    id: int
    metric_date: date
    total_distance_km: float
    total_moving_time_minutes: float
    daily_trimp: float
    acute_workload_7d: float
    chronic_workload_28d: float
    acwr: Optional[float] = None
    rolling_7d_distance_km: float
    rolling_28d_distance_km: float
    average_rpe: Optional[float] = None

    class Config:
        from_attributes = True

class WorkloadAnalytics(BaseModel):
    current_acwr: Optional[float]
    acwr_status: str # "optimal", "under_training", "overreaching", "high_risk"
    weekly_distance_km: float
    weekly_goal_km: float
    weekly_progress_pct: float
    monthly_distance_km: float
    acute_load: float
    chronic_load: float
    chart_data: List[DailyMetricResponse]

class RacePredictionResponse(BaseModel):
    id: int
    target_distance: str
    predicted_time_seconds: float
    predicted_time_formatted: str
    lower_bound_formatted: Optional[str]
    upper_bound_formatted: Optional[str]
    confidence_score: float
    model_name: str
    prediction_date: datetime
    key_factors: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class TrainingPlanWorkout(BaseModel):
    day: str
    date: str
    workout_type: str
    distance_km: float
    target_pace_range: str
    description: str
    purpose: str

class TrainingPlanResponse(BaseModel):
    id: int
    name: str
    target_race_distance: str
    start_date: date
    end_date: date
    is_active: bool
    current_weekly_km: float
    peak_weekly_km: float
    adaptation_reason: Optional[str]
    schedule: List[Dict[str, Any]]
