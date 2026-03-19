import os
import logging
from flask import Flask, jsonify, Blueprint, request
from .config import Config
from .extensions import db, migrate, jwt, cors, limiter


def create_app(config_class=Config):
    app = Flask(__name__)
    if isinstance(config_class, dict):
        app.config.from_mapping(config_class)
    else:
        app.config.from_object(config_class)

    # Configure Swagger
    app.config["SWAGGER"] = {
        "title": "MarketCore API",
        "uiversion": 3,
        "openapi": "3.0.3",
    }

    # Prefer backend-local OpenAPI file to avoid coupling with external docs repos.
    default_template_path = os.path.join(
        os.path.dirname(app.root_path), "docs", "api", "openapi.yaml"
    )
    template_path = app.config.get("SWAGGER_TEMPLATE_PATH", default_template_path)

    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,  # all in
                "model_filter": lambda tag: True,  # all in
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/",
    }

    # Flasgger requires template_file to be passed to Swagger constructor directly or we can recreate it
    from flasgger import Swagger

    Swagger(app, template_file=template_path, config=swagger_config)

    # Configure Logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]",
    )

    # Ensure Upload Folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Serve static files from UPLOAD_FOLDER
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        from flask import send_from_directory

        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Initialize extensions
    db.init_app(app)
    from . import models  # noqa: F401
    migrate.init_app(app, db)

    jwt.init_app(app)
    cors.init_app(
        app, resources={r"/api/*": {"origins": "*"}}
    )  # Fine-tune CORS for Angular
    limiter.init_app(app)

    # Register Blueprints
    from .api.v1.auth import auth_bp
    from .api.v1.products import products_bp
    from .api.v1.categories import categories_bp
    from .api.v1.users import users_bp
    from .api.v1.uploads import uploads_bp
    from .api.v1.interactions import interactions_bp

    api_v1_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")

    # Simple Request Logger Middleware
    @api_v1_bp.before_request
    def log_request():
        app.logger.info(f"Request: {request.method} {request.path}")

    api_v1_bp.register_blueprint(auth_bp)
    api_v1_bp.register_blueprint(products_bp)
    api_v1_bp.register_blueprint(categories_bp)
    api_v1_bp.register_blueprint(users_bp)
    api_v1_bp.register_blueprint(uploads_bp)
    api_v1_bp.register_blueprint(interactions_bp)

    app.register_blueprint(api_v1_bp)

    from .core.exceptions import APIError

    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    @app.route("/health")
    def health_check():
        return jsonify({"status": "healthy"}), 200

    return app
