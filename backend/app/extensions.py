import os

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flasgger import Swagger
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*")
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
)
swagger = Swagger()
