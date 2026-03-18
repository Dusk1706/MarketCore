import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://marketcore:marketcore_pass@localhost:5432/marketcore_db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
    DEBUG = os.getenv("FLASK_ENV") == "development"
    SWAGGER_TEMPLATE_PATH = os.getenv("SWAGGER_TEMPLATE_PATH", os.path.join(os.getcwd(), "../docs/api/openapi.yaml"))
