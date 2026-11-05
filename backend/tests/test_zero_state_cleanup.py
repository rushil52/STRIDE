import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_new_user_starts_with_zero_activities(client: AsyncClient):
    """
    Ensures that newly registered accounts always start with 0 activities,
    and no automatic seeding occurs during registration or login.
    """
    # 1. Register new user
    res = await client.post("/api/v1/auth/register", json={
        "email": "brandnew@stride.ai",
        "password": "validPassword123",
        "full_name": "Brand New Runner"
    })
    assert res.status_code == 200

    # 2. Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "brandnew@stride.ai",
        "password": "validPassword123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Check activities - MUST be empty
    act_res = await client.get("/api/v1/activities/", headers=headers)
    assert act_res.status_code == 200
    assert act_res.json() == []

    # 4. Check summary - MUST be 0
    sum_res = await client.get("/api/v1/activities/summary", headers=headers)
    assert sum_res.status_code == 200
    assert sum_res.json()["total_runs"] == 0
    assert sum_res.json()["total_distance_km"] == 0.0

    # 5. Check workload - MUST be empty chart data
    workload_res = await client.get("/api/v1/analytics/workload", headers=headers)
    assert workload_res.status_code == 200
    assert workload_res.json()["chart_data"] == []
    assert workload_res.json()["current_acwr"] is None

@pytest.mark.asyncio
async def test_delete_synthetic_activities(client: AsyncClient):
    """
    Tests explicit deletion of synthetic activities leaving zero runs.
    """
    # 1. Register & login
    await client.post("/api/v1/auth/register", json={
        "email": "synthetic_cleanup@stride.ai",
        "password": "validPassword123"
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "synthetic_cleanup@stride.ai",
        "password": "validPassword123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Explicitly seed
    seed_res = await client.post("/api/v1/activities/seed-synthetic?days=30", headers=headers)
    assert seed_res.status_code == 200
    assert len(seed_res.json()) > 0

    # 3. Call DELETE /activities/synthetic
    del_res = await client.delete("/api/v1/activities/synthetic", headers=headers)
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["status"] == "success"
    assert del_data["deleted_activities"] > 0
    assert del_data["remaining_activities"] == 0

    # 4. Verify activity log is now completely empty
    acts_after = await client.get("/api/v1/activities/", headers=headers)
    assert acts_after.json() == []
