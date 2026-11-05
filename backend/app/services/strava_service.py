import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.config import settings

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_BASE = "https://www.strava.com/api/v3"

class StravaClient:
    """
    Client for Strava API v3 handling OAuth 2.0 token exchanges,
    refresh lifecycle, and running activity imports.
    """
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """
        Builds the user-facing OAuth consent URL for Strava.
        """
        client_id = settings.STRAVA_CLIENT_ID or "YOUR_STRAVA_CLIENT_ID"
        redirect_uri = settings.STRAVA_REDIRECT_URI
        scope = "read,activity:read_all"
        return (
            f"{STRAVA_AUTH_URL}?client_id={client_id}&response_type=code"
            f"&redirect_uri={redirect_uri}&approval_prompt=auto&scope={scope}&state={state}"
        )

    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """
        Exchanges temporary authorization code for access and refresh tokens.
        """
        if not settings.STRAVA_CLIENT_ID or not settings.STRAVA_CLIENT_SECRET:
            raise ValueError("Strava credentials not configured in backend/.env")
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_TOKEN_URL,
                data={
                    "client_id": settings.STRAVA_CLIENT_ID,
                    "client_secret": settings.STRAVA_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code"
                },
                timeout=15.0
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
        """
        Refreshes expired Strava access token using the long-lived refresh token.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_TOKEN_URL,
                data={
                    "client_id": settings.STRAVA_CLIENT_ID,
                    "client_secret": settings.STRAVA_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token
                },
                timeout=15.0
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def get_athlete_activities(
        access_token: str,
        after: Optional[int] = None,
        page: int = 1,
        per_page: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Retrieves running activities from the Strava athlete account.
        Filters out rides, walks, or other non-running activities automatically.
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        params: Dict[str, Any] = {"page": page, "per_page": per_page}
        if after:
            params["after"] = after

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{STRAVA_API_BASE}/athlete/activities",
                headers=headers,
                params=params,
                timeout=20.0
            )
            response.raise_for_status()
            raw_activities = response.json()
            
            # Filter specifically for running activities
            running_activities = [
                act for act in raw_activities 
                if act.get("type") in ["Run", "TrailRun"] or act.get("sport_type") in ["Run", "TrailRun"]
            ]
            return running_activities

    @staticmethod
    def map_strava_to_activity_dict(strava_act: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes a Strava API activity object into STRIDE internal representation.
        """
        distance_m = float(strava_act.get("distance", 0.0))
        moving_time_s = int(strava_act.get("moving_time", 0))
        elapsed_time_s = int(strava_act.get("elapsed_time", moving_time_s))
        
        # Pace
        pace_sec_km = (moving_time_s / (distance_m / 1000.0)) if distance_m > 0 else 0.0
        
        # Splits
        splits_metric = strava_act.get("splits_metric", [])
        
        return {
            "external_id": str(strava_act.get("id")),
            "source": "strava",
            "title": strava_act.get("name", "Strava Run"),
            "activity_type": strava_act.get("sport_type", "Run"),
            "start_date": datetime.fromisoformat(strava_act["start_date"].replace("Z", "+00:00")),
            "distance_meters": distance_m,
            "moving_time_seconds": moving_time_s,
            "elapsed_time_seconds": elapsed_time_s,
            "elevation_gain_meters": float(strava_act.get("total_elevation_gain", 0.0)),
            "average_speed_mps": float(strava_act.get("average_speed", 0.0)),
            "average_pace_sec_km": pace_sec_km,
            "average_heartrate": float(strava_act["average_heartrate"]) if "average_heartrate" in strava_act else None,
            "max_heartrate": float(strava_act["max_heartrate"]) if "max_heartrate" in strava_act else None,
            "average_cadence": float(strava_act["average_cadence"] * 2) if "average_cadence" in strava_act and strava_act["average_cadence"] else None,
            "splits_data": splits_metric
        }

strava_client = StravaClient()
