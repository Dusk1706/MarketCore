import json


def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        data=json.dumps(
            {
                "email": "test@example.com",
                "password": "password123",
                "name": "Test User",
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 201
    assert b"User created successfully" in response.data


def test_login_user(client):
    # First register
    client.post(
        "/api/v1/auth/register",
        data=json.dumps(
            {
                "email": "login@example.com",
                "password": "password123",
                "name": "Login User",
            }
        ),
        content_type="application/json",
    )

    # Then login
    response = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "login@example.com", "password": "password123"}),
        content_type="application/json",
    )

    assert response.status_code == 200
    data = json.loads(response.data)
    assert "access_token" in data
    assert data["user"]["email"] == "login@example.com"
