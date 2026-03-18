from flask import Blueprint, jsonify
from app.schemas.category import CategorySchema
from app.services.category_service import CategoryService

categories_bp = Blueprint("categories", __name__, url_prefix="/categories")


@categories_bp.route("", methods=["GET"])
def get_categories():
    categories = CategoryService.get_categories()
    schema = CategorySchema(many=True)
    return jsonify(schema.dump(categories)), 200
