from app.repositories.user_repository import UserRepository
from app.repositories.product_repository import ProductRepository
from app.core.exceptions import NotFoundError, ValidationError, AuthenticationError
from app.extensions import db


class UserService:
    @staticmethod
    def get_profile(user_id: int):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    @staticmethod
    def update_profile(user_id: int, data: dict):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        if "email" in data and data["email"] != user.email:
            existing = UserRepository.get_by_email(data["email"])
            if existing:
                raise ValidationError("Email already in use")
            user.email = data["email"]

        if "name" in data:
            user.name = data["name"]

        return UserRepository.save(user)

    @staticmethod
    def update_password(user_id: int, data: dict):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        if not user.check_password(data["current_password"]):
            raise AuthenticationError("Incorrect current password")

        user.set_password(data["new_password"])
        UserRepository.save(user)
        return user

    @staticmethod
    def add_favorite(user_id: int, product_id: int):
        user = UserRepository.get_by_id(user_id)
        product = ProductRepository.get_by_id(product_id)

        if not user or not product:
            raise NotFoundError("User or Product not found")

        if product not in user.favorites:
            user.favorites.append(product)
            db.session.commit()
        return True

    @staticmethod
    def remove_favorite(user_id: int, product_id: int):
        user = UserRepository.get_by_id(user_id)
        product = ProductRepository.get_by_id(product_id)

        if not user or not product:
            raise NotFoundError("User or Product not found")

        if product in user.favorites:
            user.favorites.remove(product)
            db.session.commit()
        return True

    @staticmethod
    def get_favorites(user_id: int):
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user.favorites
