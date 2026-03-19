import os
import tempfile
import pytest
from app import create_app
from app.extensions import db


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def app():
    with tempfile.TemporaryDirectory() as tmp_upload_folder:
        test_config = {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-secret-key-with-at-least-32-bytes",
            "RATELIMIT_ENABLED": False,  # Disable ratelimit for tests
            "SWAGGER_TEMPLATE_PATH": os.path.join(BACKEND_DIR, "docs", "api", "openapi.yaml"),
            "UPLOAD_FOLDER": tmp_upload_folder,
        }
        app = create_app(test_config)

        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
