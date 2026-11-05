from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models.user import User
from app.models.activity import Activity
from app.models.metric import DailyMetric
from app.models.prediction import RacePrediction, TrainingPlan
from app.schemas.analytics import WorkloadAnalytics, DailyMetricResponse, RacePredictionResponse, TrainingPlanResponse
from app.api.deps import get_current_user
from app.ml.sports_science import calculate_rolling_acwr, classify_acwr, format_duration
from app.ml.feature_extraction import extract_runner_features
from app.ml.race_predictor import race_predictor
from app.ml.training_optimizer import adaptive_optimizer

router = APIRouter()

@router.get("/workload", response_model=WorkloadAnalytics)
async def get_workload_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all activities for user
    stmt = (
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.start_date.asc())
    )
    activities = (await db.execute(stmt)).scalars().all()
    
    if not activities:
        return {
            "current_acwr": None,
            "acwr_status": "insufficient_data",
            "weekly_distance_km": 0.0,
            "weekly_goal_km": current_user.weekly_mileage_goal_km or 30.0,
            "weekly_progress_pct": 0.0,
            "monthly_distance_km": 0.0,
            "acute_load": 0.0,
            "chronic_load": 0.0,
            "chart_data": []
        }
        
    # Group activities into daily records
    daily_map = {}
    for act in activities:
        d = act.start_date.date()
        if d not in daily_map:
            daily_map[d] = {
                "metric_date": d,
                "total_distance_km": 0.0,
                "total_moving_time_minutes": 0.0,
                "daily_trimp": 0.0,
                "rpe_sum": 0.0,
                "rpe_count": 0
            }
        daily_map[d]["total_distance_km"] += (act.distance_meters / 1000.0)
        daily_map[d]["total_moving_time_minutes"] += (act.moving_time_seconds / 60.0)
        daily_map[d]["daily_trimp"] += (act.trimp_score or 0.0)
        if act.rpe_score:
            daily_map[d]["rpe_sum"] += act.rpe_score
            daily_map[d]["rpe_count"] += 1

    daily_list = []
    for d, data in daily_map.items():
        daily_list.append({
            "metric_date": d.isoformat(),
            "total_distance_km": round(data["total_distance_km"], 2),
            "total_moving_time_minutes": round(data["total_moving_time_minutes"], 1),
            "daily_trimp": round(data["daily_trimp"], 1),
            "average_rpe": round(data["rpe_sum"] / data["rpe_count"], 1) if data["rpe_count"] > 0 else None
        })

    # Run EWMA Sports Science Model
    acwr_df = calculate_rolling_acwr(daily_list)
    
    if acwr_df.empty:
        return {
            "current_acwr": None,
            "acwr_status": "insufficient_data",
            "weekly_distance_km": 0.0,
            "weekly_goal_km": current_user.weekly_mileage_goal_km or 30.0,
            "weekly_progress_pct": 0.0,
            "monthly_distance_km": 0.0,
            "acute_load": 0.0,
            "chronic_load": 0.0,
            "chart_data": []
        }
        
    last_row = acwr_df.iloc[-1]
    current_acwr = float(last_row["acwr"]) if not pd.isna(last_row["acwr"]) else None
    
    # Weekly mileage calculation (last 7 days)
    seven_days_ago = datetime.utcnow().date() - timedelta(days=7)
    recent_7d = [d for d in daily_list if datetime.fromisoformat(d["metric_date"]).date() >= seven_days_ago]
    weekly_dist = sum(item["total_distance_km"] for item in recent_7d)
    weekly_goal = current_user.weekly_mileage_goal_km or 30.0
    progress_pct = min(150.0, (weekly_dist / max(1.0, weekly_goal)) * 100.0)
    
    # Format chart data (last 30 days)
    chart_subset = acwr_df.tail(30)
    chart_records = []
    for idx, row in chart_subset.iterrows():
        chart_records.append({
            "id": idx,
            "metric_date": row["metric_date"].date(),
            "total_distance_km": round(float(row["total_distance_km"]), 1),
            "total_moving_time_minutes": round(float(row["total_moving_time_minutes"]), 1),
            "daily_trimp": round(float(row["daily_trimp"]), 1),
            "acute_workload_7d": round(float(row["acute_workload_7d"]), 1),
            "chronic_workload_28d": round(float(row["chronic_workload_28d"]), 1),
            "acwr": round(float(row["acwr"]), 2) if not pd.isna(row["acwr"]) else None,
            "rolling_7d_distance_km": round(float(row["rolling_7d_distance_km"]), 1),
            "rolling_28d_distance_km": round(float(row["rolling_28d_distance_km"]), 1),
            "average_rpe": None
        })

    return {
        "current_acwr": current_acwr,
        "acwr_status": classify_acwr(current_acwr),
        "weekly_distance_km": round(weekly_dist, 1),
        "weekly_goal_km": weekly_goal,
        "weekly_progress_pct": round(progress_pct, 1),
        "monthly_distance_km": round(float(last_row["rolling_28d_distance_km"]), 1),
        "acute_load": round(float(last_row["acute_workload_7d"]), 1),
        "chronic_load": round(float(last_row["chronic_workload_28d"]), 1),
        "chart_data": chart_records
    }

import pandas as pd

@router.get("/predictions", response_model=List[RacePredictionResponse])
async def get_predictions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes multi-distance race predictions (5K, 10K, Half Marathon)
    using the ML feature extraction & calibrated VDOT engine.
    """
    stmt = (
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.start_date.desc())
    )
    activities = (await db.execute(stmt)).scalars().all()
    
    act_dicts = [
        {
            "start_date": a.start_date,
            "distance_meters": a.distance_meters,
            "moving_time_seconds": a.moving_time_seconds,
            "average_speed_mps": a.average_speed_mps,
            "average_pace_sec_km": a.average_pace_sec_km,
            "average_heartrate": a.average_heartrate
        }
        for a in activities
    ]
    
    features = extract_runner_features(act_dicts)
    distances = ["5K", "10K", "Half"]
    predictions = []
    
    for idx, dist in enumerate(distances):
        pred = race_predictor.predict(features, target_distance=dist)
        predictions.append({
            "id": idx + 1,
            "target_distance": dist,
            "predicted_time_seconds": pred["predicted_time_seconds"],
            "predicted_time_formatted": format_duration(pred["predicted_time_seconds"]),
            "lower_bound_formatted": format_duration(pred["lower_bound_seconds"]),
            "upper_bound_formatted": format_duration(pred["upper_bound_seconds"]),
            "confidence_score": pred["confidence_score"],
            "model_name": pred["model_name"],
            "prediction_date": datetime.utcnow(),
            "key_factors": pred["feature_snapshot"]
        })
        
    return predictions

@router.get("/plan", response_model=TrainingPlanResponse)
async def get_adaptive_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves or dynamically updates the athlete's 7-day adaptive training microcycle.
    """
    # Check if active plan exists in DB
    stmt = (
        select(TrainingPlan)
        .where(TrainingPlan.user_id == current_user.id, TrainingPlan.is_active == True)
        .order_by(desc(TrainingPlan.created_at))
    )
    existing_plan = (await db.execute(stmt)).scalar_one_or_none()
    
    if existing_plan:
        return {
            "id": existing_plan.id,
            "name": existing_plan.name,
            "target_race_distance": existing_plan.target_race_distance,
            "start_date": existing_plan.start_date,
            "end_date": existing_plan.end_date,
            "is_active": existing_plan.is_active,
            "current_weekly_km": existing_plan.current_weekly_km,
            "peak_weekly_km": existing_plan.peak_weekly_km,
            "adaptation_reason": existing_plan.adaptation_reason,
            "schedule": existing_plan.schedule
        }

    # Otherwise generate a new plan calibrated to current runner state
    act_stmt = (
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.start_date.desc())
    )
    activities = (await db.execute(act_stmt)).scalars().all()
    act_dicts = [{"start_date": a.start_date, "distance_meters": a.distance_meters, "moving_time_seconds": a.moving_time_seconds, "average_speed_mps": a.average_speed_mps, "average_pace_sec_km": a.average_pace_sec_km, "average_heartrate": a.average_heartrate} for a in activities]
    features = extract_runner_features(act_dicts)
    
    generated = adaptive_optimizer.generate_plan(
        current_weekly_km=features.get("weekly_km_avg", current_user.weekly_mileage_goal_km or 25.0),
        target_distance=current_user.target_race_distance or "5K",
        current_acwr=1.05,
        vdot=features.get("estimated_vdot", 38.0)
    )
    
    new_db_plan = TrainingPlan(
        user_id=current_user.id,
        name=generated["name"],
        target_race_distance=generated["target_race_distance"],
        start_date=generated["start_date"],
        end_date=generated["end_date"],
        is_active=True,
        current_weekly_km=generated["current_weekly_km"],
        peak_weekly_km=generated["peak_weekly_km"],
        adaptation_reason=generated["adaptation_reason"],
        schedule=generated["schedule"]
    )
    db.add(new_db_plan)
    await db.commit()
    await db.refresh(new_db_plan)
    
    return {
        "id": new_db_plan.id,
        "name": new_db_plan.name,
        "target_race_distance": new_db_plan.target_race_distance,
        "start_date": new_db_plan.start_date,
        "end_date": new_db_plan.end_date,
        "is_active": new_db_plan.is_active,
        "current_weekly_km": new_db_plan.current_weekly_km,
        "peak_weekly_km": new_db_plan.peak_weekly_km,
        "adaptation_reason": new_db_plan.adaptation_reason,
        "schedule": new_db_plan.schedule
    }

@router.post("/plan/adapt", response_model=TrainingPlanResponse)
async def adapt_plan_on_feedback(
    perceived_fatigue_score: int = Query(..., ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually triggers adaptive Bayesian re-optimization based on subjective fatigue/recovery input.
    """
    # Deactivate existing plans
    stmt = select(TrainingPlan).where(TrainingPlan.user_id == current_user.id, TrainingPlan.is_active == True)
    existing_plans = (await db.execute(stmt)).scalars().all()
    for p in existing_plans:
        p.is_active = False
        
    act_stmt = select(Activity).where(Activity.user_id == current_user.id).order_by(Activity.start_date.desc())
    activities = (await db.execute(act_stmt)).scalars().all()
    act_dicts = [{"start_date": a.start_date, "distance_meters": a.distance_meters, "moving_time_seconds": a.moving_time_seconds, "average_speed_mps": a.average_speed_mps, "average_pace_sec_km": a.average_pace_sec_km, "average_heartrate": a.average_heartrate} for a in activities]
    features = extract_runner_features(act_dicts)

    generated = adaptive_optimizer.generate_plan(
        current_weekly_km=features.get("weekly_km_avg", current_user.weekly_mileage_goal_km or 25.0),
        target_distance=current_user.target_race_distance or "5K",
        current_acwr=1.2,
        recent_rpe_avg=float(perceived_fatigue_score),
        vdot=features.get("estimated_vdot", 38.0)
    )
    
    new_db_plan = TrainingPlan(
        user_id=current_user.id,
        name=f"Adapted Microcycle (Fatigue RPE: {perceived_fatigue_score}/10)",
        target_race_distance=generated["target_race_distance"],
        start_date=generated["start_date"],
        end_date=generated["end_date"],
        is_active=True,
        current_weekly_km=generated["current_weekly_km"],
        peak_weekly_km=generated["peak_weekly_km"],
        adaptation_reason=f"Athlete reported fatigue level {perceived_fatigue_score}/10. {generated['adaptation_reason']}",
        schedule=generated["schedule"]
    )
    db.add(new_db_plan)
    await db.commit()
    await db.refresh(new_db_plan)
    
    return {
        "id": new_db_plan.id,
        "name": new_db_plan.name,
        "target_race_distance": new_db_plan.target_race_distance,
        "start_date": new_db_plan.start_date,
        "end_date": new_db_plan.end_date,
        "is_active": new_db_plan.is_active,
        "current_weekly_km": new_db_plan.current_weekly_km,
        "peak_weekly_km": new_db_plan.peak_weekly_km,
        "adaptation_reason": new_db_plan.adaptation_reason,
        "schedule": new_db_plan.schedule
    }
