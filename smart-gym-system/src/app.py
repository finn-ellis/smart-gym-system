from flask import Flask
from flask_socketio import SocketIO

# UC3 trace: update profile -> assign wristband -> pairWristband -> poll -> return/unpair.

def create_app() -> Flask:
    """
    Flask Application Factory.
    Initializes the app and registers blueprints from various handlers.
    """
    app = Flask(__name__)
    
    # Initialize extensions
    socketio = SocketIO(cors_allowed_origins="*")
    socketio.init_app(app)
    app.extensions["socketio"] = socketio
    
    # Initialize core services
    from .data_analytics_engine import DataAnalyticsEngine
    from .data_stores import (
        AlertLog,
        GymStatesArchive,
        MemberHealthProfiles,
        ReportsArchive,
        VideoClipsArchive,
    )
    from .datatypes import CustomizedHealthThresholds, MemberProfile
    from .gym_management_portal_handler import create_portal_blueprint
    from .iot_gateway import IoTGateway, create_iot_blueprint
    from .mllm_handler import MLLMHandler
    from .report_generation_handler import ReportGenerationHandler
    from .wristband_handler import WristbandHandler
    
    member_health_profiles = MemberHealthProfiles(
        [
            MemberProfile(
                member_id="member-001",
                display_name="Demo Member One",
                notes="Default UC3 demo profile.",
                thresholds=CustomizedHealthThresholds(heart_rate_max=170.0),
            ),
            MemberProfile(
                member_id="member-002",
                display_name="Demo Member Two",
                notes="Higher-risk demo profile with tighter monitoring thresholds.",
                thresholds=CustomizedHealthThresholds(
                    heart_rate_max=155.0,
                    temperature_max=37.5,
                ),
            ),
        ]
    )
    gym_states_archive = GymStatesArchive()
    alert_log = AlertLog()
    reports_archive = ReportsArchive()
    video_clips_archive = VideoClipsArchive()
    iot_gateway = IoTGateway()
    analytics_engine = DataAnalyticsEngine(gym_states_archive, alert_log, socketio)
    wristband_handler = WristbandHandler(member_health_profiles, iot_gateway, analytics_engine)
    report_generation_handler = ReportGenerationHandler(reports_archive)
    mllm_handler = MLLMHandler(video_clips_archive, analytics_engine)
    app.extensions["smart_gym_services"] = {
        "member_health_profiles": member_health_profiles,
        "gym_states_archive": gym_states_archive,
        "alert_log": alert_log,
        "reports_archive": reports_archive,
        "video_clips_archive": video_clips_archive,
        "iot_gateway": iot_gateway,
        "analytics_engine": analytics_engine,
        "wristband_handler": wristband_handler,
        "report_generation_handler": report_generation_handler,
        "mllm_handler": mllm_handler,
    }
    
    # Register Blueprints
    app.register_blueprint(
        create_portal_blueprint(
            member_health_profiles,
            alert_log,
            reports_archive,
            gym_states_archive,
            video_clips_archive,
            analytics_engine,
            wristband_handler,
            socketio,
        ),
        url_prefix='/api',
    )
    app.register_blueprint(create_iot_blueprint(iot_gateway), url_prefix='/iot')
    
    return app

if __name__ == "__main__":
    app = create_app()
    socketio = app.extensions["socketio"]
    socketio.run(app, debug=True)
