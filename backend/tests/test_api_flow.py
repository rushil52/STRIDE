import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "STRIDE API"

@pytest.mark.asyncio
async def test_auth_and_synthetic_seed(client):
    # 1. Register new athlete
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "runner@stride.ai",
        "password": "SecurePassword123!",
        "full_name": "Antigravity Runner"
    })
    assert reg_res.status_code == 200
    user_data = reg_res.json()
    assert user_data["email"] == "runner@stride.ai"
    
    # 2. Login to retrieve JWT
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "runner@stride.ai",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    token = token_data["access_token"]
    assert token is not None
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Seed realistic synthetic running activities
    seed_res = await client.post("/api/v1/activities/seed-synthetic?days=40", headers=headers)
    assert seed_res.status_code == 200
    activities = seed_res.json()
    assert len(activities) > 10
    
    # 4. Check Workload Analytics
    workload_res = await client.get("/api/v1/analytics/workload", headers=headers)
    assert workload_res.status_code == 200
    workload_data = workload_res.json()
    assert "current_acwr" in workload_data
    assert len(workload_data["chart_data"]) > 0
    
    # 5. Check Race Predictions
    pred_res = await client.get("/api/v1/analytics/predictions", headers=headers)
    assert pred_res.status_code == 200
    preds = pred_res.json()
    assert len(preds) == 3 # 5K, 10K, Half
    assert preds[0]["target_distance"] == "5K"
    
    # 6. Check Adaptive Training Plan
    plan_res = await client.get("/api/v1/analytics/plan", headers=headers)
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert len(plan_data["schedule"]) == 7
