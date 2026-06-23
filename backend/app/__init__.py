from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register all blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.schools import schools_bp
    from .routes.students import students_bp
    from .routes.attendance import attendance_bp
    from .routes.reports import reports_bp
    from .routes.locations import locations_bp
    from .routes.dos_teachers_students import students_for_teachers_bp

    app.register_blueprint(auth_bp,       url_prefix='/api/auth')
    app.register_blueprint(users_bp,      url_prefix='/api/users')
    app.register_blueprint(schools_bp,    url_prefix='/api/schools')
    app.register_blueprint(students_bp,   url_prefix='/api/students')
    app.register_blueprint(students_for_teachers_bp, url_prefix='/api/dos-teachers-students')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(reports_bp,    url_prefix='/api/reports')
    app.register_blueprint(locations_bp,  url_prefix='/api/locations')

    return app
