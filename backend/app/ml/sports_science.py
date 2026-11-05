import math
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
import pandas as pd
import numpy as np

def calculate_pace_sec_km(distance_meters: float, moving_time_seconds: int) -> float:
    """Calculates pace in seconds per kilometer."""
    if distance_meters <= 0 or moving_time_seconds <= 0:
        return 0.0
    km = distance_meters / 1000.0
    return moving_time_seconds / km

def format_pace(seconds_per_km: float) -> str:
    """Formats seconds per kilometer as MM:SS/km."""
    if seconds_per_km <= 0 or math.isinf(seconds_per_km) or math.isnan(seconds_per_km):
        return "--:--/km"
    minutes = int(seconds_per_km // 60)
    seconds = int(seconds_per_km % 60)
    return f"{minutes}:{seconds:02d}/km"

def format_duration(seconds: float) -> str:
    """Formats total seconds to HH:MM:SS or MM:SS."""
    if seconds <= 0 or math.isinf(seconds) or math.isnan(seconds):
        return "00:00"
    hours = int(seconds // 3600)
    rem = seconds % 3600
    minutes = int(rem // 60)
    secs = int(rem % 60)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"

def calculate_banister_trimp(
    duration_minutes: float,
    avg_hr: Optional[float],
    resting_hr: int = 55,
    max_hr: int = 190,
    gender: str = "male"
) -> float:
    """
    Banister TRIMP (Training Impulse) formula:
    TRIMP = Duration (min) * DeltaHR * 0.64 * e^(y * DeltaHR)
    where DeltaHR = (HR_avg - HR_rest) / (HR_max - HR_rest)
    y = 1.92 for men, 1.67 for women.
    """
    if duration_minutes <= 0:
        return 0.0
    
    if avg_hr is None or avg_hr <= resting_hr:
        # Fallback to duration-based moderate estimation (e.g. RPE 5 default load)
        return float(duration_minutes * 1.5)
        
    # Heart rate reserve fractional elevation
    hr_max = max(max_hr, avg_hr + 5)
    hr_rest = min(resting_hr, avg_hr - 5)
    
    delta_hr = (avg_hr - hr_rest) / (hr_max - hr_rest)
    delta_hr = max(0.01, min(1.0, delta_hr))
    
    y = 1.92 if gender.lower() == "male" else 1.67
    trimp = duration_minutes * delta_hr * 0.64 * math.exp(y * delta_hr)
    return round(float(trimp), 2)

def calculate_rolling_acwr(
    daily_records: List[Dict[str, Any]], 
    acute_decay_days: int = 7, 
    chronic_decay_days: int = 28
) -> pd.DataFrame:
    """
    Calculates Acute:Chronic Workload Ratio using Exponentially Weighted Moving Averages (EWMA).
    EWMA is superior to rolling rolling-window sums because it models biological decay and fatigue accumulation.
    """
    if not daily_records:
        return pd.DataFrame()
        
    df = pd.DataFrame(daily_records)
    df["metric_date"] = pd.to_datetime(df["metric_date"])
    df = df.sort_values("metric_date").reset_index(drop=True)
    
    # Ensure daily continuity (reindex for all continuous dates)
    full_range = pd.date_range(start=df["metric_date"].min(), end=df["metric_date"].max(), freq="D")
    df = df.set_index("metric_date").reindex(full_range).fillna({
        "total_distance_km": 0.0,
        "total_moving_time_minutes": 0.0,
        "daily_trimp": 0.0
    }).rename_axis("metric_date").reset_index()
    
    # EWMA Lambda weights: lambda = 2 / (N + 1)
    lambda_acute = 2.0 / (acute_decay_days + 1.0)
    lambda_chronic = 2.0 / (chronic_decay_days + 1.0)
    
    # Calculate EWMA on training load (daily_trimp if available, fallback to distance_km * 10)
    effective_load = df["daily_trimp"].where(df["daily_trimp"] > 0, df["total_distance_km"] * 10.0)
    
    df["acute_workload_7d"] = effective_load.ewm(alpha=lambda_acute, adjust=False).mean()
    df["chronic_workload_28d"] = effective_load.ewm(alpha=lambda_chronic, adjust=False).mean()
    
    # Rolling 7d & 28d distances for intuitive runner feedback
    df["rolling_7d_distance_km"] = df["total_distance_km"].rolling(window=7, min_periods=1).sum()
    df["rolling_28d_distance_km"] = df["total_distance_km"].rolling(window=28, min_periods=1).sum()
    
    # ACWR Ratio
    # Avoid zero division
    df["acwr"] = np.where(
        df["chronic_workload_28d"] > 0.5,
        df["acute_workload_7d"] / df["chronic_workload_28d"],
        np.nan
    )
    
    return df

def classify_acwr(acwr: Optional[float]) -> str:
    """
    Standard Sports Science Classification (Gabbett, 2016):
    < 0.8: Under-training / fitness decaying
    0.8 - 1.3: Optimal 'Sweet Spot' (progressive overload with manageable fatigue)
    1.3 - 1.5: Overreaching / elevated risk
    > 1.5: High injury risk zone
    """
    if acwr is None or math.isnan(acwr):
        return "insufficient_data"
    if acwr < 0.8:
        return "under_training"
    elif acwr <= 1.3:
        return "optimal"
    elif acwr <= 1.5:
        return "overreaching"
    else:
        return "high_risk"
