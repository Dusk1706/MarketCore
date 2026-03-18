from typing import Optional
from app.models.user import User
from app.extensions import db


class UserRepository:
    @staticmethod
    def get_by_email(email: str) -> Optional[User]:
        return User.query.filter_by(email=email).first()

    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        return db.session.get(User, user_id)

    @staticmethod
    def save(user: User) -> User:
        db.session.add(user)
        db.session.commit()
        return user
