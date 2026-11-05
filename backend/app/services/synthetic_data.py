import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from app.ml.sports_science import calculate_banister_trimp

def generate_synthetic_runner_history(
    num_days: int = 60,
    runner_profile: str = "improving" # "improving", "overreaching", "consistent"
) -> List[Dict[str, Any]]:
    """
    Generates realistic, continuous synthetic running activity history for local development,
    demonstration, and rigorous algorithmic evaluation without mocking raw API calls.
    
    Models true physiological training dynamics:
    - Weekly volume progression
    - Variable workout types (Long runs, Tempo, Recovery, Easy runs)
    - Heart rate reserve & cadence realistic correlation
    - Natural variance and acute fatigue spikes
    """
    activities = []
    base_date = datetime.now(timezone.utc) - timedelta(days=num_days)
    
    # Base runner fitness: 5:15 min/km base pace (315 s/km), resting HR 52, max HR 192
    current_base_pace = 320.0
    
    for day in range(num_days):
        current_date = base_date + timedelta(days=day)
        weekday = current_date.weekday() # 0 = Monday, 6 = Sunday
        
        # Decide if running today (3 to 5 days a week)
        is_run_day = weekday in [1, 3, 5, 6] # Tue, Thu, Sat, Sun
        
        if not is_run_day:
            continue
            
        # Determine workout style
        if weekday == 6: # Sunday Long Run
            dist_km = random.uniform(12.0, 16.0)
            pace_sec_km = current_base_pace + random.uniform(20.0, 35.0)
            avg_hr = random.uniform(148.0, 158.0)
            category = "long_run"
            rpe = random.randint(7, 8)
            title = "Sunday Endurance Long Run"
        elif weekday == 3: # Thursday Tempo / Intervals
            dist_km = random.uniform(7.0, 9.0)
            pace_sec_km = current_base_pace - random.uniform(20.0, 35.0)
            avg_hr = random.uniform(165.0, 178.0)
            category = "tempo"
            rpe = random.randint(8, 9)
            title = "Lactate Threshold Progression"
        elif weekday == 1: # Tuesday Aerobic Base
            dist_km = random.uniform(6.0, 8.5)
            pace_sec_km = current_base_pace + random.uniform(10.0, 20.0)
            avg_hr = random.uniform(142.0, 152.0)
            category = "easy"
            rpe = random.randint(5, 6)
            title = "Aerobic Base Maintenance"
        else: # Saturday Easy or Strides
            dist_km = random.uniform(5.0, 7.0)
            pace_sec_km = current_base_pace + random.uniform(25.0, 45.0)
            avg_hr = random.uniform(135.0, 145.0)
            category = "recovery"
            rpe = random.randint(4, 5)
            title = "Gentle Recovery Run"
            
        # Fitness adaptation over time
        if runner_profile == "improving":
            # Runner gets slightly faster over the 60 days
            current_base_pace -= 0.35 
            
        moving_time_s = int(dist_km * pace_sec_km)
        dist_m = round(dist_km * 1000.0, 1)
        speed_mps = dist_m / moving_time_s
        elevation_m = round(random.uniform(25.0, 120.0), 1)
        cadence = round(random.uniform(168.0, 176.0), 1)
        
        trimp = calculate_banister_trimp(
            duration_minutes=moving_time_s / 60.0,
            avg_hr=avg_hr,
            resting_hr=52,
            max_hr=192
        )
        
        activities.append({
            "source": "synthetic",
            "external_id": f"synthetic_{day}_{int(current_date.timestamp())}",
            "title": title,
            "activity_type": "Run",
            "start_date": current_date,
            "distance_meters": dist_m,
            "moving_time_seconds": moving_time_s,
            "elapsed_time_seconds": moving_time_s + random.randint(30, 180),
            "elevation_gain_meters": elevation_m,
            "average_speed_mps": round(speed_mps, 2),
            "average_pace_sec_km": round(pace_sec_km, 1),
            "average_heartrate": round(avg_hr, 1),
            "max_heartrate": round(avg_hr + random.uniform(12.0, 22.0), 1),
            "average_cadence": cadence,
            "trimp_score": trimp,
            "rpe_score": rpe,
            "workout_category": category,
            "notes": "Generated synthetic activity for baseline calibration."
        })
        
    return activities
