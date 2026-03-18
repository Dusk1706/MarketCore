from typing import Optional
from sqlalchemy.orm import joinedload
from app.models.product import Product
from app.models.category import Category
from app.extensions import db


class ProductRepository:
    @staticmethod
    def get_all(
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        seller_id: Optional[int] = None,
        page: int = 1,
        per_page: int = 10,
    ):
        # Usamos joinedload para traer seller y category en el mismo query (Evita N+1)
        query = Product.query.options(
            joinedload(Product.seller), joinedload(Product.category)
        )

        if search:
            query = query.filter(
                (Product.title.ilike(f"%{search}%"))
                | (Product.description.ilike(f"%{search}%"))
            )

        if category_slug:
            query = query.join(Category).filter(Category.slug == category_slug)

        if min_price is not None:
            query = query.filter(Product.price >= min_price)

        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        if seller_id:
            query = query.filter(Product.user_id == seller_id)

        return query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def get_by_id(product_id: int) -> Optional[Product]:
        # SQLAlchemy 2.0 style loading related models
        return db.session.get(Product, product_id)

    @staticmethod
    def save(product: Product) -> Product:
        db.session.add(product)
        db.session.commit()
        return product

    @staticmethod
    def delete(product: Product) -> None:
        db.session.delete(product)
        db.session.commit()
