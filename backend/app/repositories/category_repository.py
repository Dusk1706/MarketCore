from app.models.category import Category
from app.extensions import db

class CategoryRepository:
    @staticmethod
    def get_all():
        return Category.query.all()

    @staticmethod
    def get_by_slug(slug):
        return Category.query.filter_by(slug=slug).first()

    @staticmethod
    def save(category):
        db.session.add(category)
        db.session.commit()
        return category
