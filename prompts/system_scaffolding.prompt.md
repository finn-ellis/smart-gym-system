**System Scaffolding & Structure Initialization**

**Role:** Expert Software Architect and Developer

**Task:** Implement the initial project scaffolding and file structure for the Smart Gym Management System (SGMS). Your goal is to create a bare-bones, structural foundation based *strictly* on our Software Architecture Design (SAD) document.

**CRITICAL CONSTRAINT:** DO NOT implement any business logic or application functionality. Create *only* empty classes, placeholder methods, routes, and standard boilerplate (e.g., imports, class definitions, docstrings). Your implementation must be 1:1 traceable to the components listed in the SAD. Keep all naming conventions identical to the SAD.

**Project Structure & Tech Stack:**
1. **Backend (src):** Python, Flask, Flask-SocketIO
2. **Frontend (src):** React / Vite

**Backend Component Requirements (Python/Flask):**
Please create the corresponding files/modules in the src directory. Each should contain an empty class or basic boilerplate reflecting its purpose:
*   `iot_gateway.py`: Class `IoTGateway` with placeholder methods for `pollSensor(SensorId)` and `pollWristband(WristbandId)`.
*   `mllm_handler.py`: Class `MLLMHandler` that will eventually interface with Gemini 3.1 Pro.
*   `environmental_sensor_handler.py`: Class `EnvironmentalSensorHandler`.
*   `wristband_handler.py`: Class `WristbandHandler` with placeholder methods `pairWristband(WristbandId, MemberId)` and `unpairWristband(WristbandId)`.
*   `data_analytics_engine.py`: Class `DataAnalyticsEngine` maintaining `GymState` and routing interfaces like `onSensorProcess`, `onBiometricAlert`, `onVideoAlert`, `onOccupancyCounted`, and `dismissAlert`.
*   `report_generation_handler.py`: Class `ReportGenerationHandler` with interfaces `bufferMetrics(MetricsLoad)` and `compileReport(ReportType)`.
*   `gym_management_portal_handler.py`: Set up the bare-bones Flask and Flask-SocketIO server. Include empty route definitions and socket events for: `getAlerts`, `viewAlert`, `dismissAlert`, `getReports`, `viewReport`, `subscribeGymState` (WebSocket), `getGymStates`, `getMemberProfile`, `updateMemberProfile`, `getVideoClip`, `assignWristband`, and `onWristbandReturned`.
*   `data_stores.py`: Empty wrapper classes or dictionaries representing: `MemberHealthProfiles`, `GymStatesArchive`, `ReportsArchive`, `VideoClipsArchive`, and `AlertLog`.

**Frontend Component Requirements (React/Vite):**
Please scaffold the application inside src reflecting the `Gym Management Portal App`.
*   Create an empty foundational layout and routing setup.
*   Create empty placeholder React components mapped to the User Actions defined in the SAD:
    *   `ReportBrowsing.jsx`
    *   `GymStateDashboard.jsx` (Real-Time and Historical Graph)
    *   `AlertsDashboard.jsx` (Alert Notifications, Alert Browsing, Alert Dismissal)
    *   `MemberProfiles.jsx` (Member Profile Browsing & Updating)
    *   `WristbandManagement.jsx` (Wristband Assigning & Returning)

**Execution Steps:**
1. Read the provided architecture document to verify the exact names and responsibilities of each component.
2. Generate the directory structure and empty files.
3. Populate the files with basic class definitions, Flask web server boilerplate, WebSocket initialization, and React component scaffolding.
4. Stop. Review to ensure zero functional logic has been written.