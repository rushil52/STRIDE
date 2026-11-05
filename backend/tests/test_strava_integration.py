import pytest
from app.services.strava_service import strava_client

@pytest.mark.asyncio
async def test_strava_unconfigured_error_handling(client):
    """
    Ensures that when client_id/secret are unconfigured, STRIDE returns
    a clean descriptive error rather than generating invalid URLs that cause Strava 400 Bad Request.
    """
    # 1. Login user
    res_reg = await client.post("/api/v1/auth/register", json={
        "email": "strava_tester@stride.ai",
        "password": "validPassword123"
    })
    token_res = await client.post("/api/v1/auth/login", json={
        "email": "strava_tester@stride.ai",
        "password": "validPassword123"
    })
    token = token_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check Strava status endpoint
    status_res = await client.get("/api/v1/strava/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "is_api_configured" in status_data

    # 3. Requesting connect URL when unconfigured must return a readable 400 error
    connect_res = await client.get("/api/v1/strava/connect-url", headers=headers)
    if not strava_client.is_configured():
        assert connect_res.status_code == 400
        assert "not configured" in connect_res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_strava_activity_deduplication(client):
    """
    Verifies that the Strava activity parser and mapper tolerate missing
    heart rate, cadence, and splits gracefully.
    """
    raw_strava_minimal = {
        "id": 987654321,
        "name": "Casual Neighborhood Jog",
        "type": "Run",
        "distance": 6200.0,
        "moving_time": 1860,
        "elapsed_time": 1900,
        "total_elevation_gain": 45.0,
        "average_speed": 3.33,
        # missing average_heartrate, max_heartrate, average_cadence
    }

    mapped = strava_client.map_strava_to_activity_dict(raw_strava_minimal)
    assert mapped["external_id"] == "987654321"
    assert mapped["distance_meters"] == 6200.0
    assert mapped["average_heartrate"] is None
    assert mapped["average_cadence"] is None
    assert mapped["average_pace_sec_km"] == 300.0
