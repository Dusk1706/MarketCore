from flask_jwt_extended import create_access_token
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.core.exceptions import AuthenticationError, ValidationError

class AuthService:
    @staticmethod
    def register(email, password, name):
        if UserRepository.get_by_email(email):
            raise ValidationError("User already exists")

        user = User(email=email, name=name)
        user.set_password(password)
        UserRepository.save(user)
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
