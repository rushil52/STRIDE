import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
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
    def is_configured() -> bool:
        """Checks if genuine Strava client credentials are configured."""
        client_id = (settings.STRAVA_CLIENT_ID or "").strip()
        client_secret = (settings.STRAVA_CLIENT_SECRET or "").strip()
        return bool(client_id and client_secret and client_id != "YOUR_STRAVA_CLIENT_ID")

    @staticmethod
    def get_authorization_url(state: str) -> str:
        """
        Builds the user-facing OAuth consent URL for Strava.
        """
        if not StravaClient.is_configured():
            raise ValueError(
                "Strava API credentials are not configured. Please set STRAVA_CLIENT_ID and "
                "STRAVA_CLIENT_SECRET in backend/.env to connect your real Strava athlete account."
            )
        client_id = settings.STRAVA_CLIENT_ID.strip()
        redirect_uri = settings.STRAVA_REDIRECT_URI.strip()
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
        if not StravaClient.is_configured():
            raise ValueError(
                "Strava credentials not configured in backend/.env. "
                "Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET from developers.strava.com."
            )
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_TOKEN_URL,
                data={
                    "client_id": settings.STRAVA_CLIENT_ID.strip(),
                    "client_secret": settings.STRAVA_CLIENT_SECRET.strip(),
                    "code": code.strip(),
                    "grant_type": "authorization_code"
                },
                timeout=15.0
            )
            if response.status_code != 200:
                err_json = response.json() if "application/json" in response.headers.get("content-type", "") else response.text
                raise ValueError(f"Strava token exchange failed: {err_json}")
            return response.json()

    @staticmethod
    async def get_valid_token(user_access_token: str, user_refresh_token: Optional[str], token_expires_at: Optional[int]) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Validates token freshness. If expired, performs automatic OAuth refresh rotation.
        Returns: (valid_access_token, updated_token_data_or_None)
        """
        now_ts = int(datetime.utcnow().timestamp())
        # Buffer of 120 seconds
        if token_expires_at and token_expires_at < (now_ts + 120):
            if not user_refresh_token:
                raise ValueError("Strava access token expired and no refresh token available.")
            refreshed = await StravaClient.refresh_access_token(user_refresh_token)
            return refreshed["access_token"], refreshed
        return user_access_token, None

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
        """
        Refreshes expired Strava access token using the long-lived refresh token.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_TOKEN_URL,
                data={
                    "client_id": settings.STRAVA_CLIENT_ID.strip(),
                    "client_secret": settings.STRAVA_CLIENT_SECRET.strip(),
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token.strip()
                },
                timeout=15.0
            )
            if response.status_code != 200:
                raise ValueError(f"Failed to refresh Strava token: {response.text}")
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
            if response.status_code != 200:
                raise ValueError(f"Strava API error ({response.status_code}): {response.text}")
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
        Handles missing fields gracefully (HR, cadence, splits, elevation).
        """
        distance_m = float(strava_act.get("distance", 0.0))
        moving_time_s = int(strava_act.get("moving_time", 0))
        elapsed_time_s = int(strava_act.get("elapsed_time", moving_time_s))
        
        # Pace calculation
        pace_sec_km = (moving_time_s / (distance_m / 1000.0)) if distance_m > 0 else 0.0
        
        # Splits
        splits_metric = strava_act.get("splits_metric", [])
        
        # Date parsing
        raw_start = strava_act.get("start_date")
        if raw_start:
            start_dt = datetime.fromisoformat(raw_start.replace("Z", "+00:00"))
        else:
            start_dt = datetime.utcnow()
        
        # Cadence handling: Strava returns SPM for single foot or RPM for cycling
        raw_cadence = strava_act.get("average_cadence")
        cadence_val = float(raw_cadence * 2) if raw_cadence is not None else None
        
        return {
            "external_id": str(strava_act.get("id")),
            "source": "strava",
            "title": strava_act.get("name") or "Strava Run",
            "activity_type": strava_act.get("sport_type") or strava_act.get("type") or "Run",
            "start_date": start_dt,
            "distance_meters": distance_m,
            "moving_time_seconds": moving_time_s,
            "elapsed_time_seconds": elapsed_time_s,
            "elevation_gain_meters": float(strava_act.get("total_elevation_gain", 0.0)),
            "average_speed_mps": float(strava_act.get("average_speed", 0.0)),
            "average_pace_sec_km": pace_sec_km,
            "average_heartrate": float(strava_act["average_heartrate"]) if strava_act.get("average_heartrate") is not None else None,
            "max_heartrate": float(strava_act["max_heartrate"]) if strava_act.get("max_heartrate") is not None else None,
            "average_cadence": cadence_val,
            "splits_data": splits_metric
        }

from typing import Tuple
strava_client = StravaClient()
