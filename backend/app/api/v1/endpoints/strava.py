from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.activity import Activity
from app.api.deps import get_current_user
from app.services.strava_service import strava_client
from app.ml.sports_science import calculate_banister_trimp

router = APIRouter()

@router.get("/connect-url")
def get_strava_connect_url(current_user: User = Depends(get_current_user)) -> Dict[str, str]:
    """
    Returns the Strava OAuth2 authorization URL with athlete state token.
    """
    state = f"user_{current_user.id}"
    url = strava_client.get_authorization_url(state=state)
    return {"url": url}

@router.post("/exchange-token")
async def exchange_strava_code(
    code: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Exchanges Strava OAuth authorization code for access and refresh tokens.
    """
    try:
        token_data = await strava_client.exchange_code_for_token(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange Strava code: {str(e)}")
        
    athlete = token_data.get("athlete", {})
    current_user.strava_athlete_id = athlete.get("id")
    current_user.strava_access_token = token_data.get("access_token")
    current_user.strava_refresh_token = token_data.get("refresh_token")
    current_user.strava_token_expires_at = token_data.get("expires_at")
    
    await db.commit()
    await db.refresh(current_user)
    return {"status": "success", "athlete_id": current_user.strava_athlete_id}

@router.post("/sync")
async def sync_strava_activities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches running activities from Strava, deduplicates, and saves into database.
    """
    if not current_user.strava_access_token:
        raise HTTPException(status_code=400, detail="Strava account is not connected.")
        
    try:
        raw_runs = await strava_client.get_athlete_activities(current_user.strava_access_token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error communicating with Strava API: {str(e)}")
        
    imported_count = 0
    for raw in raw_runs:
        mapped = strava_client.map_strava_to_activity_dict(raw)
        trimp = calculate_banister_trimp(
            duration_minutes=mapped["moving_time_seconds"] / 60.0,
            avg_hr=mapped["average_heartrate"],
            resting_hr=current_user.resting_heart_rate or 55,
            max_hr=current_user.max_heart_rate or 190
        )
        act = Activity(
            user_id=current_user.id,
            source="strava",
            external_id=mapped["external_id"],
            title=mapped["title"],
            activity_type=mapped["activity_type"],
            start_date=mapped["start_date"],
            distance_meters=mapped["distance_meters"],
            moving_time_seconds=mapped["moving_time_seconds"],
            elapsed_time_seconds=mapped["elapsed_time_seconds"],
            elevation_gain_meters=mapped["elevation_gain_meters"],
            average_speed_mps=mapped["average_speed_mps"],
            average_pace_sec_km=mapped["average_pace_sec_km"],
            average_heartrate=mapped["average_heartrate"],
            max_heartrate=mapped["max_heartrate"],
            average_cadence=mapped["average_cadence"],
            splits_data=mapped["splits_data"],
            trimp_score=trimp,
            workout_category="easy"
        )
        db.add(act)
        imported_count += 1
        
    await db.commit()
    return {"status": "success", "synced_activities": imported_count}

@router.get("/webhook")
def strava_webhook_validation(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token")
):
    """
    Handles Strava Webhook Handshake verification.
    """
    if hub_verify_token != settings.STRAVA_WEBHOOK_VERIFY_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid verify token")
    return {"hub.challenge": hub_challenge}
