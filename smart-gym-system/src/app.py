from flask import Flask
from flask_socketio import SocketIO

# Initialize SocketIO without an app initially for blueprint/handler compatibility
socketio = SocketIO(cors_allowed_origins="*")

def create_app() -> Flask:
    """
    Flask Application Factory.
    Initializes the app and registers blueprints from various handlers.
    """
    app = Flask(__name__)
    
    # Initialize extensions
    socketio.init_app(app)
    
    # Initialize core services
    from .data_stores import MemberHealthProfiles
    from .iot_gateway import IoTGateway, create_iot_blueprint
    from .wristband_handler import WristbandHandler
    from .data_analytics_engine import DataAnalyticsEngine
    from .gym_management_portal_handler import create_portal_blueprint
    
    member_health_profiles = MemberHealthProfiles()
    iot_gateway = IoTGateway()
    analytics_engine = DataAnalyticsEngine()
    wristband_handler = WristbandHandler(member_health_profiles, iot_gateway, analytics_engine)
    
    # Register Blueprints
    app.register_blueprint(create_portal_blueprint(member_health_profiles, wristband_handler, socketio), url_prefix='/api')
    app.register_blueprint(create_iot_blueprint(iot_gateway), url_prefix='/iot')
    
    return app

if __name__ == "__main__":
    app = create_app()
    socketio.run(app, debug=True)
