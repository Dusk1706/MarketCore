import json
import io


def get_auth_header(client):
    # Register and login to get token
    client.post(
        "/api/v1/auth/register",
        data=json.dumps(
            {
                "email": "uploader@example.com",
                "password": "password123",
                "name": "Uploader User",
            }
        ),
        content_type="application/json",
    )

    response = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "uploader@example.com", "password": "password123"}),
        content_type="application/json",
    )

    token = json.loads(response.data)["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_upload_image(client):
    headers = get_auth_header(client)

    data = {"image": (io.BytesIO(b"fake image data"), "test.png")}

    response = client.post(
        "/api/v1/uploads",
        data=data,
        headers=headers,
        content_type="multipart/form-data",
    )

    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert "url" in response_data
    assert "/uploads/" in response_data["url"]
    assert response_data["url"].endswith(".png")
