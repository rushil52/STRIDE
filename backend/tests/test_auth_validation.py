import pytest

@pytest.mark.asyncio
async def test_auth_validation_errors(client):
    """
    Verifies that backend authentication validation handles
    bad emails, short passwords, duplicate emails, and incorrect logins.
    """
    # 1. Invalid email format
    res_bad_email = await client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "validPassword123"
    })
    assert res_bad_email.status_code == 422
    data_bad_email = res_bad_email.json()
    assert isinstance(data_bad_email["detail"], list)
    assert any("email" in err["loc"] for err in data_bad_email["detail"])

    # 2. Password too short (< 6 characters)
    res_short_pw = await client.post("/api/v1/auth/register", json={
        "email": "valid@stride.ai",
        "password": "123"
    })
    assert res_short_pw.status_code == 422
    data_short_pw = res_short_pw.json()
    assert any("password" in err["loc"] for err in data_short_pw["detail"])

    # 3. Successful registration
    res_ok = await client.post("/api/v1/auth/register", json={
        "email": "valid@stride.ai",
        "password": "validPassword123",
        "full_name": "Valid Runner"
    })
    assert res_ok.status_code == 200
    user_data = res_ok.json()
    assert user_data["email"] == "valid@stride.ai"

    # 4. Duplicate registration attempt
    res_dup = await client.post("/api/v1/auth/register", json={
        "email": "valid@stride.ai",
        "password": "anotherPassword123"
    })
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()

    # 5. Bad password login
    res_bad_login = await client.post("/api/v1/auth/login", json={
        "email": "valid@stride.ai",
        "password": "WrongPassword!"
    })
    assert res_bad_login.status_code == 401
    assert "incorrect" in res_bad_login.json()["detail"].lower()
