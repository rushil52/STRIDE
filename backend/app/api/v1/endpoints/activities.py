from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.db.session import get_db
from app.models.user import User
from app.models.activity import Activity
from app.models.metric import DailyMetric
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivitySummary
from app.api.deps import get_current_user
from app.ml.sports_science import calculate_pace_sec_km, calculate_banister_trimp, format_pace, format_duration
from app.services.activity_parser import parse_gpx_content, parse_fit_content
from app.services.synthetic_data import generate_synthetic_runner_history

router = APIRouter()

def serialize_activity(act: Activity) -> dict:
    d = {
        "id": act.id,
        "user_id": act.user_id,
        "source": act.source,
        "external_id": act.external_id,
        "title": act.title,
        "activity_type": act.activity_type,
        "start_date": act.start_date,
        "distance_meters": act.distance_meters,
        "moving_time_seconds": act.moving_time_seconds,
        "elapsed_time_seconds": act.elapsed_time_seconds,
        "elevation_gain_meters": act.elevation_gain_meters,
        "average_speed_mps": act.average_speed_mps,
        "average_pace_sec_km": act.average_pace_sec_km,
        "pace_formatted": format_pace(act.average_pace_sec_km),
        "average_heartrate": act.average_heartrate,
        "max_heartrate": act.max_heartrate,
        "average_cadence": act.average_cadence,
        "trimp_score": act.trimp_score,
        "rpe_score": act.rpe_score,
        "feeling": act.feeling,
        "workout_category": act.workout_category,
        "splits_data": act.splits_data,
        "notes": act.notes,
        "created_at": act.created_at,
    }
    return d

@router.get("/", response_model=List[ActivityResponse])
async def list_activities(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(desc(Activity.start_date))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    activities = result.scalars().all()
    return [serialize_activity(act) for act in activities]

@router.post("/manual", response_model=ActivityResponse)
async def create_manual_activity(
    activity_in: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    pace_sec = calculate_pace_sec_km(activity_in.distance_meters, activity_in.moving_time_seconds)
    speed_mps = activity_in.distance_meters / max(1, activity_in.moving_time_seconds)
    
    trimp = calculate_banister_trimp(
        duration_minutes=activity_in.moving_time_seconds / 60.0,
        avg_hr=activity_in.average_heartrate,
        resting_hr=current_user.resting_heart_rate or 55,
        max_hr=current_user.max_heart_rate or 190
    )
    
    db_act = Activity(
        user_id=current_user.id,
        source="manual",
        title=activity_in.title,
        activity_type=activity_in.activity_type,
        start_date=activity_in.start_date,
        distance_meters=activity_in.distance_meters,
        moving_time_seconds=activity_in.moving_time_seconds,
        elapsed_time_seconds=activity_in.elapsed_time_seconds,
        elevation_gain_meters=activity_in.elevation_gain_meters,
        average_speed_mps=speed_mps,
        average_pace_sec_km=pace_sec,
        average_heartrate=activity_in.average_heartrate,
        max_heartrate=activity_in.max_heartrate,
        average_cadence=activity_in.average_cadence,
        trimp_score=trimp,
        rpe_score=activity_in.rpe_score,
        feeling=activity_in.feeling,
        workout_category=activity_in.workout_category or "easy",
        splits_data=activity_in.splits_data,
        notes=activity_in.notes
    )
    db.add(db_act)
    await db.commit()
    await db.refresh(db_act)
    return serialize_activity(db_act)

@router.post("/upload", response_model=ActivityResponse)
async def upload_activity_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts GPX or FIT binary file upload and saves structured workout.
    """
    content = await file.read()
    filename = (file.filename or "").lower()
    
    if filename.endswith(".gpx"):
        parsed = parse_gpx_content(content)
    elif filename.endswith(".fit"):
        parsed = parse_fit_content(content)
    else:
        raise HTTPException(status_code=400, detail="Only .gpx and .fit files are supported.")
        
    trimp = calculate_banister_trimp(
        duration_minutes=parsed["moving_time_seconds"] / 60.0,
        avg_hr=parsed.get("average_heartrate"),
        resting_hr=current_user.resting_heart_rate or 55,
        max_hr=current_user.max_heart_rate or 190
    )
    
    db_act = Activity(
        user_id=current_user.id,
        source=parsed["source"],
        title=parsed["title"],
        activity_type=parsed["activity_type"],
        start_date=parsed["start_date"],
        distance_meters=parsed["distance_meters"],
        moving_time_seconds=parsed["moving_time_seconds"],
        elapsed_time_seconds=parsed["elapsed_time_seconds"],
        elevation_gain_meters=parsed["elevation_gain_meters"],
        average_speed_mps=parsed["average_speed_mps"],
        average_pace_sec_km=parsed["average_pace_sec_km"],
        average_heartrate=parsed.get("average_heartrate"),
        max_heartrate=parsed.get("max_heartrate"),
        trimp_score=trimp,
        workout_category="easy"
    )
    db.add(db_act)
    await db.commit()
    await db.refresh(db_act)
    return serialize_activity(db_act)

@router.post("/seed-synthetic", response_model=List[ActivityResponse])
async def seed_synthetic_activities(
    days: int = Query(default=60, ge=14, le=180),
    profile: str = Query(default="improving"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Seeds realistic physiological running data for immediate local development,
    analytics visualization, and machine learning model validation.
    """
    synthetic_runs = generate_synthetic_runner_history(num_days=days, runner_profile=profile)
    inserted = []
    
    for item in synthetic_runs:
        db_act = Activity(
            user_id=current_user.id,
            source=item["source"],
            external_id=item["external_id"],
            title=item["title"],
            activity_type=item["activity_type"],
            start_date=item["start_date"],
            distance_meters=item["distance_meters"],
            moving_time_seconds=item["moving_time_seconds"],
            elapsed_time_seconds=item["elapsed_time_seconds"],
            elevation_gain_meters=item["elevation_gain_meters"],
            average_speed_mps=item["average_speed_mps"],
            average_pace_sec_km=item["average_pace_sec_km"],
            average_heartrate=item["average_heartrate"],
            max_heartrate=item["max_heartrate"],
            average_cadence=item["average_cadence"],
            trimp_score=item["trimp_score"],
            rpe_score=item["rpe_score"],
            workout_category=item["workout_category"],
            notes=item["notes"]
        )
        db.add(db_act)
        inserted.append(db_act)
        
    await db.commit()
    for act in inserted:
        await db.refresh(act)
    return [serialize_activity(act) for act in inserted]

@router.get("/summary", response_model=ActivitySummary)
async def get_summary_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(
        func.count(Activity.id),
        func.sum(Activity.distance_meters),
        func.sum(Activity.moving_time_seconds),
        func.avg(Activity.average_pace_sec_km),
        func.avg(Activity.average_heartrate)
    ).where(Activity.user_id == current_user.id)
    
    res = (await db.execute(stmt)).first()
    total_runs = res[0] or 0
    total_meters = res[1] or 0.0
    total_seconds = res[2] or 0
    avg_pace_sec = res[3] or 0.0
    avg_hr = res[4]
    
    return {
        "total_runs": total_runs,
        "total_distance_km": round(total_meters / 1000.0, 1),
        "total_duration_hours": round(total_seconds / 3600.0, 1),
        "average_pace_formatted": format_pace(avg_pace_sec),
        "average_hr": round(avg_hr, 1) if avg_hr else None
    }
