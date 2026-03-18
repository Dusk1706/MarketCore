import json

def get_auth_header(client):
    # Register and login to get token
    client.post('/api/v1/auth/register', data=json.dumps({
        "email": "prod@example.com",
        "password": "password123",
        "name": "Prod User"
    }), content_type='application/json')
    
    response = client.post('/api/v1/auth/login', data=json.dumps({
        "email": "prod@example.com",
        "password": "password123"
    }), content_type='application/json')
    
    token = json.loads(response.data)['access_token']
    return {'Authorization': f'Bearer {token}'}

def create_category(client):
    from app.models.category import Category
    from app.extensions import db
    cat = Category(name="Test Category", slug="test-cat")
    db.session.add(cat)
    db.session.commit()

def test_full_product_lifecycle(client):
    create_category(client)
    headers = get_auth_header(client)

    # 1. Create Product (POST)
    response = client.post('/api/v1/products', data=json.dumps({
        "title": "Test Product",
        "description": "Original Description",
        "price": 100.0,
        "category_slug": "test-cat"
    }), headers=headers, content_type='application/json')
    assert response.status_code == 201
    product_id = json.loads(response.data)['id']

    # 2. Get Product Detail (GET)
    response = client.get(f'/api/v1/products/{product_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == "Test Product"

    # 3. List Products with Filter (GET)
    response = client.get('/api/v1/products?category_slug=test-cat')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'products' in data
    assert 'meta' in data
    assert len(data['products']) == 1

    # 4. Partial Update (PATCH)
    response = client.patch(f'/api/v1/products/{product_id}', data=json.dumps({
        "title": "Updated Title"
    }), headers=headers, content_type='application/json')
    assert response.status_code == 200

    # Verify update
    response = client.get(f'/api/v1/products/{product_id}')
    data = json.loads(response.data)
    assert data['title'] == "Updated Title"
    assert data['description'] == "Original Description" # Should remain same

    # 5. Delete Product (DELETE)
    response = client.delete(f'/api/v1/products/{product_id}', headers=headers)
    assert response.status_code == 204

    # Verify deletion
    response = client.get(f'/api/v1/products/{product_id}')
    assert response.status_code == 404

def test_get_categories(client):
    create_category(client)
    response = client.get('/api/v1/categories')
    assert response.status_code == 200
    assert len(json.loads(response.data)) >= 1
