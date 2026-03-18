from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.user import UserSchema
from app.schemas.user_profile import UserProfileUpdateSchema, UserPasswordUpdateSchema
from app.schemas.product import ProductSchema
from app.services.user_service import UserService

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = UserService.get_profile(user_id)
    schema = UserSchema()
    return jsonify(schema.dump(user)), 200


@users_bp.route("/me", methods=["PUT", "PATCH"])
@jwt_required()
def update_profile():
    schema = UserProfileUpdateSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    user_id = int(get_jwt_identity())
    user = UserService.update_profile(user_id, data)
    user_schema = UserSchema()
    return jsonify(user_schema.dump(user)), 200


@users_bp.route("/me/password", methods=["PUT"])
@jwt_required()
def update_password():
    schema = UserPasswordUpdateSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    user_id = int(get_jwt_identity())
    UserService.update_password(user_id, data)
    return jsonify({"message": "Password updated successfully"}), 200


@users_bp.route("/me/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    user_id = int(get_jwt_identity())
    favorites = UserService.get_favorites(user_id)
    schema = ProductSchema(many=True)
    return jsonify(schema.dump(favorites)), 200


@users_bp.route("/me/favorites/<int:product_id>", methods=["POST"])
@jwt_required()
def add_favorite(product_id):
    user_id = int(get_jwt_identity())
    UserService.add_favorite(user_id, product_id)
    return jsonify({"message": "Added to favorites"}), 201


@users_bp.route("/me/favorites/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(product_id):
    user_id = int(get_jwt_identity())
    UserService.remove_favorite(user_id, product_id)
    return "", 204
