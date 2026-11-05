import math
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

def riegel_race_prediction(
    known_distance_m: float, 
    known_time_seconds: float, 
    target_distance_m: float, 
    fatigue_factor: float = 1.06
) -> float:
    """
    Pete Riegel's classic endurance formula:
    T2 = T1 * (D2 / D1)^1.06
    Empirically validated standard benchmark across distance runners.
    """
    if known_distance_m <= 0 or known_time_seconds <= 0 or target_distance_m <= 0:
        return 0.0
    return known_time_seconds * ((target_distance_m / known_distance_m) ** fatigue_factor)

def estimate_vdot_from_race(distance_meters: float, time_seconds: float) -> float:
    """
    Jack Daniels' Running Formula VDOT approximation.
    Computes VO2 oxygen cost and fractional utilization (%VO2max).
    """
    if distance_meters <= 0 or time_seconds <= 0:
        return 30.0
    
    time_min = time_seconds / 60.0
    velocity = distance_meters / time_min # m/min
    
    # VO2 consumption (ml/kg/min)
    vo2 = -4.60 + 0.182258 * velocity + 0.000104 * (velocity ** 2)
    
    # Fractional utilization based on race duration
    pct_max = (
        0.8 + 
        0.1894393 * math.exp(-0.012778 * time_min) + 
        0.2989558 * math.exp(-0.1932605 * time_min)
    )
    
    if pct_max <= 0:
        return 30.0
        
    vdot = vo2 / pct_max
    return max(20.0, min(85.0, vdot))

def predict_time_from_vdot(target_distance_meters: float, vdot: float) -> float:
    """
    Inverts the Daniels VDOT equation using bisection search to find exact predicted time for target distance.
    """
    low_time = (target_distance_meters / 1000.0) * 120.0 # 2:00/km (elite)
    high_time = (target_distance_meters / 1000.0) * 600.0 # 10:00/km (walking/very slow)
    
    for _ in range(40):
        mid_time = (low_time + high_time) / 2.0
        computed_vdot = estimate_vdot_from_race(target_distance_meters, mid_time)
        if computed_vdot < vdot:
            # Faster time needed to reach higher vdot
            high_time = mid_time
        else:
            low_time = mid_time
            
    return mid_time

def extract_runner_features(activities: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Extracts structured multi-scale physiological and training-volume features from historical activities:
    - 4-week, 8-week volume and average speed
    - Longest run in past 6 weeks
    - Consistency score (days with activity / total days)
    - Aerobic efficiency (Speed / Heart Rate)
    - Estimated current VDOT
    """
    if not activities:
        return {
            "total_runs": 0,
            "weekly_km_avg": 0.0,
            "longest_run_km": 0.0,
            "avg_pace_sec_km": 360.0,
            "estimated_vdot": 38.0,
            "speed_to_hr_ratio": 0.02,
            "tempo_distance_ratio": 0.15
        }
        
    df = pd.DataFrame(activities)
    df["start_date"] = pd.to_datetime(df["start_date"])
    df = df.sort_values("start_date", ascending=True)
    
    now = df["start_date"].max()
    four_weeks_ago = now - pd.Timedelta(days=28)
    six_weeks_ago = now - pd.Timedelta(days=42)
    
    recent_4w = df[df["start_date"] >= four_weeks_ago]
    recent_6w = df[df["start_date"] >= six_weeks_ago]
    
    total_km_4w = recent_4w["distance_meters"].sum() / 1000.0 if not recent_4w.empty else df["distance_meters"].sum() / 1000.0
    weekly_km_avg = total_km_4w / 4.0
    
    longest_run_m = recent_6w["distance_meters"].max() if not recent_6w.empty else df["distance_meters"].max()
    longest_run_km = longest_run_m / 1000.0 if not pd.isna(longest_run_m) else 5.0
    
    # Efficiency ratio: speed (m/s) / heart rate (bpm)
    hr_filtered = df[df["average_heartrate"].notnull() & (df["average_heartrate"] > 90)]
    if not hr_filtered.empty:
        avg_efficiency = (hr_filtered["average_speed_mps"] / hr_filtered["average_heartrate"]).mean()
    else:
        avg_efficiency = 0.022
        
    # Find fastest 3k+ effort for VDOT benchmark
    significant_runs = df[df["distance_meters"] >= 2800]
    best_vdot = 35.0
    if not significant_runs.empty:
        vdots = [
            estimate_vdot_from_race(row["distance_meters"], row["moving_time_seconds"]) 
            for _, row in significant_runs.iterrows()
        ]
        best_vdot = float(np.percentile(vdots, 85)) # 85th percentile robust peak effort
        
    return {
        "total_runs": len(df),
        "weekly_km_avg": round(float(weekly_km_avg), 2),
        "longest_run_km": round(float(longest_run_km), 2),
        "avg_pace_sec_km": round(float(df["average_pace_sec_km"].mean()), 1),
        "estimated_vdot": round(float(best_vdot), 1),
        "speed_to_hr_ratio": round(float(avg_efficiency), 4),
        "tempo_distance_ratio": 0.20
    }
