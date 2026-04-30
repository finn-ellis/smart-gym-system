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
    
    # Register Blueprints
    from .gym_management_portal_handler import portal_bp
    from .iot_gateway import iot_bp
    
    app.register_blueprint(portal_bp, url_prefix='/api')
    app.register_blueprint(iot_bp, url_prefix='/iot')
    
    return app

if __name__ == "__main__":
    app = create_app()
    socketio.run(app, debug=True)
