from app import create_app
from app.extensions import db
from app.models.category import Category
from app.models.user import User
from app.models.product import Product


def seed_all():
    # 1. Categories
    categories_data = [
        {"name": "Tecnología", "slug": "tecnologia"},
        {"name": "Hogar", "slug": "hogar"},
        {"name": "Ropa", "slug": "ropa"},
        {"name": "Deportes", "slug": "deportes"},
        {"name": "Libros", "slug": "libros"},
    ]

    categories = {}
    for cat_data in categories_data:
        cat = Category.query.filter_by(slug=cat_data["slug"]).first()
        if not cat:
            cat = Category(**cat_data)
            db.session.add(cat)
            db.session.commit()
        categories[cat.slug] = cat

    # 2. Users
    users_data = [
        {
            "email": "admin@marketcore.com",
            "name": "Admin User",
            "password": "password123",
        },
        {
            "email": "vendedor@test.com",
            "name": "Juan Vendedor",
            "password": "password123",
        },
    ]

    users = []
    for u_data in users_data:
        u = User.query.filter_by(email=u_data["email"]).first()
        if not u:
            u = User(email=u_data["email"], name=u_data["name"])
            u.set_password(u_data["password"])
            db.session.add(u)
            db.session.commit()
        users.append(u)

    # 3. Products
    products_data = [
        {
            "title": "iPhone 13 Pro - 128GB",
            "description": "Excelente estado, color grafito. Incluye cargador original.",
            "price": 750.00,
            "category_slug": "tecnologia",
            "image_url": "https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1200&q=80",
        },
        {
            "title": "Sofá Cama Gris",
            "description": "Casi nuevo, 3 plazas, muy cómodo para visitas.",
            "price": 250.00,
            "category_slug": "hogar",
            "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
        },
        {
            "title": "Bicicleta de Montaña R29",
            "description": "Frenos de disco, 21 velocidades. Ideal para senderismo.",
            "price": 320.00,
            "category_slug": "deportes",
            "image_url": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1200&q=80",
        },
        {
            "title": "Chaqueta de Cuero Vintage",
            "description": "Talla M, estilo clásico de los 90. Cuero auténtico.",
            "price": 85.00,
            "category_slug": "ropa",
            "image_url": "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80",
        },
        {
            "title": "Set de Libros: El Hobbit",
            "description": "Edición de colección, tapa dura. Nuevos.",
            "price": 45.00,
            "category_slug": "libros",
            "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
        },
    ]

    for p_data in products_data:
        existing = Product.query.filter_by(title=p_data["title"]).first()
        cat = categories[p_data["category_slug"]]

        if existing:
            # Keep seed data consistent across reruns (including image changes).
            existing.description = p_data["description"]
            existing.price = p_data["price"]
            existing.image_url = p_data["image_url"]
            existing.category_id = cat.id
            existing.user_id = users[0].id
        else:
            product = Product(
                title=p_data["title"],
                description=p_data["description"],
                price=p_data["price"],
                image_url=p_data["image_url"],
                category_id=cat.id,
                user_id=users[0].id,  # Asignados al admin para demo
            )
            db.session.add(product)

    db.session.commit()
    print("Database seeded successfully with Users, Categories and Products!")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_all()
