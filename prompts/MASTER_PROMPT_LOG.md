1. Ran big system scaffolding prompt:
```md
**System Scaffolding & Structure Initialization**

**Role:** Expert Software Architect and Developer

**Task:** Implement the initial project scaffolding and file structure for the Smart Gym Management System (SGMS). Your goal is to create a bare-bones, structural foundation based *strictly* on our Software Architecture Design (SAD) document.

**CRITICAL CONSTRAINT:** DO NOT implement any business logic or application functionality. Create *only* empty classes, placeholder methods, routes, and standard boilerplate (e.g., imports, class definitions, docstrings). Your implementation must be 1:1 traceable to the components listed in the SAD. Keep all naming conventions identical to the SAD.

**Project Structure & Tech Stack:**
1. **Backend (src):** Python, Flask, Flask-SocketIO
2. **Frontend (src):** React / Vite

**Datatype Definitions:**
Before scaffolding the main components, create a shared datatypes file in both the backend (e.g., `datatypes.py` or `models.py`) and frontend (e.g., `types.js` or `types.ts`) to define the core data structures, type aliases, and enumerations derived from the SAD. These must include:
*   **Enums:** `AlertSeverity` (Informational, Warning, Critical), `ReportType` (Hourly, Daily, Weekly, Monthly), `StatusLevel` (Normal, Warning, Critical).
*   **Identifiers:** Type aliases for `SensorId`, `WristbandId`, `ZoneId`, `MemberId`, `AlertId`, `ReportId`, `VideoClipId`.
*   **Data Models (Classes/Interfaces/Types):** `ThresholdConfig`, `AirQualityReading`, `EnvironmentalReading`, `BiometricReading`, `GymState`, `AlertInfo`, `Report`, `ReportInfo`, `MemberProfile`, `VideoClip`, `OccupancyCountsByZone`, MetricsLoad: (can be omitted), and `CustomizedHealthThresholds`.

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
Utilize a strict TODO:
1. Read the provided architecture document to verify the exact names and responsibilities of each component and datatype.
2. Generate the directory structure and empty files.
3. Define all core datatypes, aliases, and models in a centralized datatypes file for both frontend and backend.
4. Populate the remaining files with basic class definitions, Flask web server boilerplate, WebSocket initialization, and React component scaffolding.
5. Stop. Review to ensure zero functional logic has been written.
```
2)
> **Precondition**
> /create-instructions Edit #file:frontend.instructions.md and clarify that frontend should be written using TypeScript `tsx`.
>
> **Task**
> Refactor frontend to use `tsx` and typescript instead of `jsx`.
3)
> Setup VITE and typescript enviroment for the frontend in #file:portal-app 
4)
> Setup a central Flask structure in #file:smart-gym-system 
> - Create `__init__.py` and `appy.py`with basic Flask development structure
> - Keep components the same (**this is required by project structure**), but add blueprint structure compatibility so that #file:gym_management_portal_handler.py can implement client routes
> - Change structure such that #file:iot_gateway.py may define routes that will be used for iot device connectivity
> - Add functionality to #file:data_analytics_engine.py to host a web socket for broadcasting gym state to client apps.
>
> **Requirements:**
> - Use a strict TODO to keep on track with these changes


## Fixing Frontend
```md
Implement a client-side `portalApi.ts` file with a request method for each route defined in #file:gym_management_portal_handler.py . 

Example usage available in #sym:WristbandManagement .
```

```md
/create-hook When backend #file:gym_management_portal_handler.py or #file:datatypes.py is updated, reflect the changes in the frontend #file:portalApi.ts 
```


## Refactor Flask structure
```md
Refactor, fix, and upgrade Flask App:
- Remove the #file:dependencies.py file. An inferior agent relied on this, but it should create all controllers with the Flask app fully created in #sym:create_app  . Only #sym:GymManagementPortalHandler and #file:iot_gateway.py need to make routes available.
- Then, ensure #sym:GymManagementPortalHandler can properly handle and communicate with #file:wristband_handler.py 
```


## Adding brainflow:
```md
Create a plan to implement EmotiBit connectivity using BrainFlow in #sym:wristband_handler. Then, pair with existing wristband architecture.


## BRAINFLOW INFO
EmotiBit
EmotiBit board
https://live.staticflickr.com/65535/52519313192_7869efa2f5.jpg
EmotiBit Website

To create such board you need to specify the following board ID and fields of BrainFlowInputParams object:

BoardIds.EMOTIBIT_BOARD

optional: ip_address, you can provide broadcast ip address of the network with EmotiBit device, e.g. 192.168.178.255. If not provided BrainFlow will try to autodiscover the network and it may take a little longer.

optional: serial_number, recommended you if have multiple boards in the same network.

Initialization Example:

params = BrainFlowInputParams()
board = BoardShim(BoardIds.EMOTIBIT_BOARD, params)
Supported platforms:

Windows

MacOS

Linux

Devices like Raspberry Pi

Available BrainFlow Presets:

BrainFlowPresets.DEFAULT_PRESET, it contains accelerometer, gyroscope and magnetometer data

BrainFlowPresets.AUXILIARY_PRESET, it contains PPG data

BrainFlowPresets.ANCILLARY_PRESET, it contains EDA and temperature data

## BRAINFLOW REFERENCES:
#file:brainflow_samples.py 

## USE CASES
### Use Case 3: Biometric Wearable Data Processing {#use-case-3:-biometric-wearable-data-processing}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | For a member to voluntarily enroll in biometric monitoring for a session, enabling the system to support their safety while they exercise, and to cleanly exit that monitoring when their session ends. |
| **Preconditions** | Biometric wristbands are available at the facility. The member has a profile in the system. Staff are present at the front desk to issue and register the device. |
| **Trigger** | A gym member arrives and is offered a biometric wristband for their session, or proactively requests one. |

**Architecture Design Flow**

**Wristband Assignment and Monitoring Start**

2. Staff use the **Gym Management Portal App** (User action: **Wristband Assigning**) to initiate the wristband pairing for a member given the member’s consent.  
3. The **Gym Management Portal App** calls the **Gym Management Portal Handler’s** updateMemberProfile interface (to save optional health data).  
4. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s assignWristband interface.  
5. The **Gym Management Portal Handler** routes the request by calling the **Wristband Handler**’s pairWristband interface.  
6. The **Wristband Handler** updates its activeSessions state and retrieves the member's personalized thresholds from the **Member Health Profiles** Data Store, storing them in its memberThresholds.  
7. The **Wristband Handler** initiates continuous data ingestion by calling the **IoT Gateway**’s pollWristband interface.  
8. Upon this call, the **IoT Gateway** reads the BiometricReading from the **Wristband Hardware** and returns it to the **Wristband Handler** for processing.

**Wristband Deassignment and Session End**

1. The member finishes their session and returns their wristband. Staff use the **Gym Management Portal App** to initiate the deregistration.  
2. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s onWristbandReturned interface.  
3. The **Gym Management Portal Handler** routes the unpairing request by calling the **Wristband Handler**’s unpairWristband interface.  
9. The **Wristband Handler** updates its activeSessions state, ending the biometric monitoring session.

### Use Case 4: Warning Health Event Detection {#use-case-4:-warning-health-event-detection}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To receive a timely, data-backed warning when a member shows unusual physiological signals, so staff can conduct a non-medical wellness check before the situation worsens. |
| **Preconditions** | The member has been issued a biometric wristband, consented to biometric monitoring for the session, and their health profile and personalized alert thresholds are on file. |
| **Trigger** | The member's wristband detects a sustained heart rate reading that breaches their personalized threshold during exercise. |

**Architecture Design Flow**

**Warning Health Event Detection and Alerting**

1. The **Wristband Handler** calls the **IoT Gateway**'s pollWristband interface regularly to read the latest biometric data from a paired wristband.  
2. The **Wristband Handler** compares the received heart rate reading against the personalized (if stored in memberThresholds) or default health thresholds and detects a breach, classifying it as a \[Warning\] severity alert.  
3. The **Wristband Handler** routes the processed BiometricReading and the Warning severity to the **Data & Analytics Engine** via the onBiometricAlert interface.  
4. The **Data & Analytics Engine** receives the alert, logs the biometric data, produces a formatted alert (including necessary context from **Member Health Profiles**), and adds the alert to the **Alert Log** and as a current alert in the **Gym State**.  
5. The **Gym Management Portal App** receives the push notification via the native device push notification API. Staff devices display the Warning alert.  
6. Staff open the alert in the **Gym Management Portal App**, which loads the alert data and the attached heart rate trend by calling the **Gym Management Portal Handler**’s viewAlert interface.  
7. Staff dismiss the alert after addressing the member's well-being. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s dismissAlert interface.  
8. The **Gym Management Portal Handler** removes the alert from the current **Gym State** by calling the **Data & Analytics Engine’s** dismissAlert interface.


## INSTRUCTIONS
Think extensively through files and only use Brainflow in the backend for processing. Implement according to defined use cases. If something is unclear or current architecture mismatches, raise the issue to me.
```

```
Great, next, ensure changes are reflected in the frontend and that both #file:portalApi.ts and #file:WristbandManagement.tsx validly interact with the backend wristband implementation
```


## Fixing Wristband UI
```md
## REFERENCE USE CASE
## USE CASES
### Use Case 3: Biometric Wearable Data Processing {#use-case-3:-biometric-wearable-data-processing}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | For a member to voluntarily enroll in biometric monitoring for a session, enabling the system to support their safety while they exercise, and to cleanly exit that monitoring when their session ends. |
| **Preconditions** | Biometric wristbands are available at the facility. The member has a profile in the system. Staff are present at the front desk to issue and register the device. |
| **Trigger** | A gym member arrives and is offered a biometric wristband for their session, or proactively requests one. |

**Architecture Design Flow**

**Wristband Assignment and Monitoring Start**

2. Staff use the **Gym Management Portal App** (User action: **Wristband Assigning**) to initiate the wristband pairing for a member given the member’s consent.  
3. The **Gym Management Portal App** calls the **Gym Management Portal Handler’s** updateMemberProfile interface (to save optional health data).  
4. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s assignWristband interface.  
5. The **Gym Management Portal Handler** routes the request by calling the **Wristband Handler**’s pairWristband interface.  
6. The **Wristband Handler** updates its activeSessions state and retrieves the member's personalized thresholds from the **Member Health Profiles** Data Store, storing them in its memberThresholds.  
7. The **Wristband Handler** initiates continuous data ingestion by calling the **IoT Gateway**’s pollWristband interface.  
8. Upon this call, the **IoT Gateway** reads the BiometricReading from the **Wristband Hardware** and returns it to the **Wristband Handler** for processing.

**Wristband Deassignment and Session End**

1. The member finishes their session and returns their wristband. Staff use the **Gym Management Portal App** to initiate the deregistration.  
2. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s onWristbandReturned interface.  
3. The **Gym Management Portal Handler** routes the unpairing request by calling the **Wristband Handler**’s unpairWristband interface.  
9. The **Wristband Handler** updates its activeSessions state, ending the biometric monitoring session.

## TASK
Implement a new, modern, beautifully clear wristband checkout interface in #file:WristbandManagement.tsx .

## Required Features
- List of wristbands currently connected to the system from backend via API
- Ability to select wristband and member from valid member profiles to assign
- We don't need to concern the user with IP or serial number, this demo only has one connected EmotiBit (wristband)
- Member health profile updates should be separate.
```