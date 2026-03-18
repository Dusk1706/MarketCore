from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.schemas.user import UserRegisterSchema, UserLoginSchema
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    schema = UserRegisterSchema()
    try:
        data = schema.load(request.json)
    except MarshmallowValidationError as err:
        return jsonify(err.messages), 400

    AuthService.register(data['email'], data['password'], data['name'])
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    schema = UserLoginSchema()
    try:
        data = schema.load(request.json)
    except MarshmallowValidationError as err:
        return jsonify(err.messages), 400

    result = AuthService.login(data['email'], data['password'])
    return jsonify(result), 200
