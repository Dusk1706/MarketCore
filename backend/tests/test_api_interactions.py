import json
import pytest

def get_auth_header(client, email="test@example.com", name="Test User"):
    # Register
    client.post(
        "/api/v1/auth/register",
        data=json.dumps({"email": email, "password": "password123", "name": name}),
        content_type="application/json",
    )
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": email, "password": "password123"}),
        content_type="application/json",
    )
    token = json.loads(response.data)["access_token"]
    user_id = json.loads(response.data)["user"]["id"]
    return {"Authorization": f"Bearer {token}"}, user_id

def create_category(client):
    from app.models.category import Category
    from app.extensions import db
    cat = db.session.get(Category, 1)
    if not cat:
        cat = Category(name="Test Category", slug="test-cat")
        db.session.add(cat)
        db.session.commit()

def create_product(client, headers):
    create_category(client)
    response = client.post(
        "/api/v1/products",
        data=json.dumps({
            "title": "Test Product",
            "description": "Desc",
            "price": 50.0,
            "category_slug": "test-cat"
        }),
        headers=headers,
        content_type="application/json",
    )
    return json.loads(response.data)["id"]


class TestOrdersAndReviews:
    def test_order_creation(self, client):
        seller_headers, seller_id = get_auth_header(client, "seller@example.com", "Seller")
        buyer_headers, buyer_id = get_auth_header(client, "buyer@example.com", "Buyer")
        product_id = create_product(client, seller_headers)

        # Fail: Buyer is seller
        response = client.post(
            "/api/v1/orders",
            data=json.dumps({"product_id": product_id}),
            headers=seller_headers,
            content_type="application/json"
        )
        assert response.status_code == 400

        # Success
        response = client.post(
            "/api/v1/orders",
            data=json.dumps({"product_id": product_id}),
            headers=buyer_headers,
            content_type="application/json"
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["total_amount"] == 50.0
        assert data["status"] == "PAID"
        assert data["buyer_id"] == buyer_id
        assert data["seller_id"] == seller_id
        
        # Product should be marked as sold
        prod_resp = client.get(f"/api/v1/products/{product_id}")
        assert json.loads(prod_resp.data)["is_sold"] is True

        # Fail: Product already sold
        response = client.post(
            "/api/v1/orders",
            data=json.dumps({"product_id": product_id}),
            headers=buyer_headers,
            content_type="application/json"
        )
        assert response.status_code == 400

    def test_orders_me(self, client):
        seller_headers, _ = get_auth_header(client, "s2@example.com", "S2")
        buyer_headers, _ = get_auth_header(client, "b2@example.com", "B2")
        product_id = create_product(client, seller_headers)
        
        client.post("/api/v1/orders", data=json.dumps({"product_id": product_id}), headers=buyer_headers, content_type="application/json")
        
        resp = client.get("/api/v1/orders/me", headers=buyer_headers)
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) >= 1
        assert data[0]["product_id"] == product_id

    def test_reviews(self, client):
        seller_headers, seller_id = get_auth_header(client, "s3@example.com", "S3")
        buyer_headers, _ = get_auth_header(client, "b3@example.com", "B3")
        other_headers, _ = get_auth_header(client, "o3@example.com", "O3")
        product_id = create_product(client, seller_headers)
        
        resp = client.post("/api/v1/orders", data=json.dumps({"product_id": product_id}), headers=buyer_headers, content_type="application/json")
        order_id = json.loads(resp.data)["id"]

        # Fail: not buyer
        resp = client.post(f"/api/v1/orders/{order_id}/reviews", data=json.dumps({"rating": 5, "comment": "Good"}), headers=other_headers, content_type="application/json")
        assert resp.status_code == 403

        # Success
        resp = client.post(f"/api/v1/orders/{order_id}/reviews", data=json.dumps({"rating": 4, "comment": "Good"}), headers=buyer_headers, content_type="application/json")
        assert resp.status_code == 201

        # Fail: already reviewed
        resp = client.post(f"/api/v1/orders/{order_id}/reviews", data=json.dumps({"rating": 5}), headers=buyer_headers, content_type="application/json")
        assert resp.status_code == 400

        # Get user reviews
        resp = client.get(f"/api/v1/users/{seller_id}/reviews")
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data["average_rating"] == 4.0
        assert data["total_sales"] >= 1
        assert len(data["reviews"]) >= 1


class TestMessaging:
    def test_messaging_flow(self, client):
        seller_headers, seller_id = get_auth_header(client, "sm1@example.com", "SM1")
        buyer_headers, buyer_id = get_auth_header(client, "bm1@example.com", "BM1")
        other_headers, _ = get_auth_header(client, "om1@example.com", "OM1")
        product_id = create_product(client, seller_headers)

        # 1. Create conversation
        resp = client.post(
            "/api/v1/conversations",
            data=json.dumps({"product_id": product_id, "content": "Is this available?"}),
            headers=buyer_headers,
            content_type="application/json"
        )
        assert resp.status_code == 201
        conv_id = json.loads(resp.data)["id"]
        
        # 2. List conversations
        resp = client.get("/api/v1/conversations", headers=seller_headers)
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert len(data) >= 1
        assert data[0]["id"] == conv_id

        # 3. Get messages (Privacy check)
        resp = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=other_headers)
        assert resp.status_code == 403

        resp = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=seller_headers)
        assert resp.status_code == 200
        messages = json.loads(resp.data)
        assert len(messages) == 1
        assert messages[0]["content"] == "Is this available?"

        # 4. Reply
        resp = client.post(
            f"/api/v1/conversations/{conv_id}/messages",
            data=json.dumps({"content": "Yes, it is."}),
            headers=seller_headers,
            content_type="application/json"
        )
        assert resp.status_code == 201

        resp = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=buyer_headers)
        messages = json.loads(resp.data)
        assert len(messages) == 2
        assert messages[1]["content"] == "Yes, it is."
