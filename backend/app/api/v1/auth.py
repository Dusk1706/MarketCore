from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from app.schemas.user import (
    UserRegisterSchema, 
    UserLoginSchema, 
    PasswordResetRequestSchema, 
    PasswordResetSchema
)
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    schema = UserRegisterSchema()
    try:
        data = schema.load(request.json)
    except MarshmallowValidationError as err:
        return jsonify(err.messages), 400

    AuthService.register(data['email'], data['password'], data['name'], request.host_url)
    return jsonify({"message": "User created. Please check your email to verify your account."}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    schema = UserLoginSchema()
    try:
        data = schema.load(request.json)
    except MarshmallowValidationError as err:
        return jsonify(err.messages), 400

    result = AuthService.login(data['email'], data['password'])
    return jsonify(result), 200

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    AuthService.verify_email(token)
    return jsonify({"message": "Email verified successfully"}), 200

@auth_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    schema = PasswordResetRequestSchema()
    try:
        data = schema.load(request.json)
    except MarshmallowValidationError as err:
        return jsonify(err.messages), 400

    AuthService.request_password_reset(data['email'], request.host_url)
    return jsonify({"message": "If that email is registered, a reset link has been sent."}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    schema = PasswordResetSchema()
    try:
        data = schema.load(request.json)
    except MarshmallowValidationError as err:
        return jsonify(err.messages), 400

    AuthService.reset_password(data['token'], data['new_password'])
    return jsonify({"message": "Password reset successfully"}), 200
