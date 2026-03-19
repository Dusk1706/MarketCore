from flask import current_app
from flask_jwt_extended import create_access_token
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.core.exceptions import AuthenticationError, ValidationError, NotFoundError
from app.services.email_service import EmailService

class AuthService:
    @staticmethod
    def get_serializer():
        return URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])

    @staticmethod
    def register(email, password, name, host_url):
        if UserRepository.get_by_email(email):
            raise ValidationError("User already exists")

        user = User(email=email, name=name)
        user.set_password(password)
        UserRepository.save(user)

        # Generar token y enviar correo de verificación
        s = AuthService.get_serializer()
        token = s.dumps(user.email, salt='email-confirm-salt')
        verify_url = f"{host_url}api/v1/auth/verify-email/{token}"
        EmailService.send_verification_email(user.email, verify_url)

        return user

    @staticmethod
    def login(email, password):
        user = UserRepository.get_by_email(email)
        if not user or not user.check_password(password):
            raise AuthenticationError("Invalid email or password")

        access_token = create_access_token(identity=str(user.id))
        return {
            "access_token": access_token,
            "user": user.to_dict()
        }

    @staticmethod
    def verify_email(token: str):
        s = AuthService.get_serializer()
        try:
            email = s.loads(token, salt='email-confirm-salt', max_age=3600) # 1 hora
        except (SignatureExpired, BadSignature):
            raise ValidationError("The confirmation link is invalid or has expired.")

        user = UserRepository.get_by_email(email)
        if not user:
            raise NotFoundError("User not found")

        if user.is_verified:
            return user

        user.is_verified = True
        UserRepository.save(user)
        return user

    @staticmethod
    def request_password_reset(email: str, host_url: str):
        user = UserRepository.get_by_email(email)
        if not user:
            # We return successfully even if user doesn't exist to prevent email enumeration
            return True

        s = AuthService.get_serializer()
        token = s.dumps(user.email, salt='password-reset-salt')

        # En una app real, el host_url apuntaría al frontend (ej. localhost:4200/reset-password?token=...)
        reset_url = f"{host_url}reset-password?token={token}"
        EmailService.send_password_reset_email(user.email, reset_url)
        return True

    @staticmethod
    def reset_password(token: str, new_password: str):
        s = AuthService.get_serializer()
        try:
            email = s.loads(token, salt='password-reset-salt', max_age=3600) # 1 hora
        except (SignatureExpired, BadSignature):
            raise ValidationError("The reset link is invalid or has expired.")

        user = UserRepository.get_by_email(email)
        if not user:
            raise NotFoundError("User not found")

        user.set_password(new_password)
        UserRepository.save(user)
        return user

