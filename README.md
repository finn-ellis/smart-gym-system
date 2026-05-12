# Smart Gym System - CS460 Project

Code Repository: https://github.com/finn-ellis/smart-gym-system

Team T05
Liepa Lavickyte (manager)
Finn Ellis
Samuel Landis
Ike Osode
Younes Slaoui

## Generative AI Tools Utilized
- GitHub Copilot
Premium editing tool used to give models context access to the codebase.

- Gemini 3 Flash
Used for quick edits, requires descriptive, exacting prompts.

- Gemini 3.1 Pro
Used for larger feature implementation with detailed prompts to ensure alignment with architecture.

- Claude Sonnet 4.6
Used for User Interface (unspecified in architecture) because it generates great React code.

## Notes
We recorded many of the big prompts used in [prompts/MASTER_PROMPT_LOG.md](prompts/MASTER_PROMPT_LOG.md). There were far too many little prompts and iterations to copy down every one into this file. I have  over 50 small edits and prompts that I didn't keep track of because it would've douled my work time to write them all down. Many prompts were along the lines of "fix this - it should be this way" or "implement this". I spent a long time converting previous code for the EmotiBit connectivity I already had, many prompts when into that. The UI required a ton of iteration and many prompts were "align the backend API and frontend API" or "implement a frontend UI containing the following features (...) using these API methods (...)".

## Prompt Log
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

## Data Store Buildout

### Prompt 1
```md
Read the following files before coding: docs/CS460 T05 Gym SAD.md, smart-gym-system/src/datatypes.py, smart-gym-system/src/data_stores.py, AGENTS.md, and smart-gym-system/AGENTS.md. Implement all five in-memory stores in smart-gym-system/src/data_stores.py using only Python dicts and lists with threading.Lock protecting concurrent mutations.

Implement MemberHealthProfiles with get_profile(member_id), update_profile(member_id, data), and list_profiles(). Raise a descriptive KeyError for unknown members.

Implement GymStatesArchive with append(gym_state), get_range(start, end), and get_latest(). Cap the archive at 10000 entries.

Implement AlertLog with add_alert(alert), get_alert(alert_id), get_alerts(start=None, end=None, limit=100), and dismiss_alert(alert_id).

Implement ReportsArchive with save_report(report), get_report(report_id), and list_reports(limit=50).

Implement VideoClipsArchive with save_clip(clip) and get_clip(clip_id).

Use only datatypes already defined in datatypes.py. If types are missing, add minimal dataclasses and include comments explaining why they were added. Every method must include a docstring referencing the SAD. Add a module docstring describing all five stores. Ensure imports have no side effects. Run ruff check smart-gym-system/src/data_stores.py before finishing.
```

### Prompt 1 Check
```md
Read the SAD, data_stores.py, and datatypes.py. Verify that all five store classes exist, no bare pass statements remain, threading.Lock protects mutations, GymStatesArchive caps at 10000 entries, AlertLog.get_alerts supports start, end, and limit parameters, new dataclasses include explanatory comments, imports succeed, ruff passes, and all methods contain docstrings. Report pass or fail for each check and list required fixes.
```

### Prompt 1 Check Follow Up
```md
Replace any remaining bare pass placeholder classes in smart-gym-system/src/datatypes.py. If a placeholder represents a real type used by the system, convert it into a minimal dataclass with the smallest valid set of fields needed by the current codebase. If the class is intentionally empty, replace the bare pass with a short class docstring explaining why the class is currently empty for the CS460 demo scope. After changes, confirm that no bare pass statements remain in datatypes.py and run ruff check smart-gym-system/src/.
```

### Prompt 2
```md
Read the SAD, app.py, all backend handlers and components, data_stores.py, datatypes.py, and AGENTS files. Instantiate all stores once inside create_app() and inject them through constructors only. Do not use globals or module-level singletons. Seed MemberHealthProfiles with at least two demo users.

Update DataAnalyticsEngine to accept GymStatesArchive and AlertLog. Implement onBiometricAlert, onSensorProcess, onVideoAlert, onOccupancyCounted, and dismissAlert with real logic. Save alerts to AlertLog, update the current GymState, and broadcast through socketio if available. Start a daemon thread that logs GymState snapshots every five minutes.

Update GymManagementPortalHandler so the required routes call real store methods for alerts, reports, gym states, members, and video clips. Do not modify the existing wristband assignment and return routes.

Ensure WristbandHandler calls MemberHealthProfiles. Update ReportGenerationHandler to save placeholder reports through ReportsArchive. Update MLLMHandler to save placeholder VideoClips through VideoClipsArchive. Add type hints to all new constructor parameters. Run ruff on smart-gym-system/src/. Add a short UC3 trace comment at the top of app.py.
```

### Prompt 2 Check
```md
Verify that stores are instantiated only in create_app(), DataAnalyticsEngine stores dependencies as attributes, the daemon logging thread exists, alert and occupancy methods contain real logic, all required routes call real store methods, wristband routes still exist unchanged, demo profiles are seeded, the UC3 trace comment exists, ruff passes, and the UC3 call chain reaches real implementations. Report pass or fail for each check and list required fixes.
```

### Prompt 3
```md
Read the SAD, data_stores.py, datatypes.py, app.py, all AGENTS.md files, and prompts/data_store_buildout.prompt.md. Do not modify Python source files.

Update the root AGENTS.md with a Data Stores section describing all five stores, the singleton injection pattern, thread safety rules, and demo profile seeding.

Update smart-gym-system/AGENTS.md with Data Store Usage Rules including an import example, constructor injection example, a store ownership and readers table, and a rule stating that all new stores must be wired through create_app().

Update portal-app/AGENTS.md with a Backend Data Store API section explaining that the frontend accesses data only through REST APIs. Add a route, store, and wrapper table plus a rule requiring developers to check for existing routes before creating new fetch calls.

Create docs/DATA_STORES.md with sections for Overview, Store Reference, Singleton Wiring, Thread Safety, Adding a New Store Checklist, and Known Limitations. Include public method signatures, reader and writer mappings, a create_app() wiring snippet, and a note explaining that all stores are in-memory.

Update prompts/data_store_buildout.prompt.md by appending a Result section summarizing the implementation.

Re-read all documentation and verify consistency with the SAD and source code.
```

## Implementing video monitoring
```md
## ARCHITECTURE DESCRIPTION
### Use Case 1: Critical Safety Event Detection {#use-case-1:-critical-safety-event-detection}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To rapidly identify a member in physical distress and receive a verifiable alert so staff can respond immediately in person. |
| **Preconditions** | Cameras are active and cover all functional gym zones. At least one staff member is on duty with the portal app open on their device. |
| **Trigger** | A gym member experiences a physical emergency (such as a fall) within a monitored zone. |

**Architecture Design Flow**

1. **Camera** feed observes the member falling to the floor.  
2. **MLLM Handler** sends an incremental clip to **Gemini 3.1 Pro** which returns a response flagging the clip as a critical injury alert.  
3. **MLLM Handler** routes the alert to the **Data & Analytics Engine** via a call to onVideoAlert.  
4. **Data & Analytics Engine** packages the alert and adds it to the **Alert Log** and as a current alert in the **Gym State**.  
5. The **Gym Management Portal App** receives the push notification via native device push notification API. Staff devices show the critical alert.  
6. Staff opens the alert in the **Gym Management Portal App** which loads the alert data with a call to the **Gym Management Portal Handler’s** viewAlert. The app also makes a call to retrieve the associated video clip from the **Video Clips Archive**. It uses this data to render and display the alert to the user with the attached video clip.  
7. Staff handle the alert and dismiss it. The **Gym Management Portal App** calls **Gym Management Portal Handler’s** dismissAlert.  
8. **Gym Management Portal Handler** removes the alert from the current **Gym State** by calling **Data & Analytics Engine’s** dismissAlert.

## USER-FACING USER CASE
### **Use Case 1: Critical Safety Event Detection** {#use-case-1:-critical-safety-event-detection}

**Capabilities Represented:** Critical Safety Event Detection

| Field | Detail |
| ----: | :---- |
| **Primary Actor** | On-Duty Staff |
| **Secondary Actors** | Gym Member, Facility-Mounted Cameras |
| **Goal in Context** | To rapidly identify a member in physical distress and receive a verifiable alert so staff can respond immediately in person. |
| **Preconditions** | Cameras are active and cover all functional gym zones. At least one staff member is on duty with the portal app open on their device. |
| **Trigger** | A gym member experiences a physical emergency (such as a fall) within a monitored zone. |

**Scenario:**

1. A member is exercising in the free-weight zone and falls to the floor.  
2. Staff on duty receive an immediate Critical push notification on their devices flagging the incident, with a short video clip of the event attached for review.  
3. Staff view the video clip to confirm what occurred before physically responding.  
4. Upon confirmation, staff proceed directly to the free-weight zone to assist the member or call emergency services as needed.  
5. The event and staff response are logged in the system for record-keeping.

**Exceptions:**

* *False positive (e.g., a dropped weight misread as a fall):* Staff view the attached clip, determine no emergency occurred, and dismiss the alert in the app.  
* *No staff acknowledge the alert within a defined timeout:* The alert is automatically escalated to Gym Management.  
* *Camera view is partially obstructed:* If the affected member is wearing a biometric wristband and has opted in, any abnormal physiological readings from the device are factored into the alert to help staff assess the situation.  
* *Staff are repeatedly receiving false Critical alerts from a specific zone:* Staff may temporarily suppress camera-based monitoring for that zone in the app until the source of the false positives is resolved.

| Field | Detail |
| ----: | :---- |
| **Frequency of Use** | Rare / Occasional;  triggered only during emergencies |
| **Channel to Actor** | Gym Management Portal App (push notification) |

---

## INSTRUCTIONS
- Based on this use case description and architecture description, implement a feature in the demo that:
1. Allow the user to record a short video clip on the frontend UI
2. Upload the short video clip to the backend server
3. Invoke the Gemini API to analyze the video for either no alert, or an incident alert.
4. Produce the alert using the existing system methods #sym:onVideoAlert 
```

## Revising API Usage
```md
## GEMINI API CODE SNIPPETS
```python
from google import genai
from google.genai import types

import requests

client = genai.Client()

# This is a manual, two turn multimodal function calling workflow:

# 1. Define the function tool
get_image_declaration = types.FunctionDeclaration(
  name="get_image",
  description="Retrieves the image file reference for a specific order item.",
  parameters={
      "type": "object",
      "properties": {
          "item_name": {
              "type": "string",
              "description": "The name or description of the item ordered (e.g., 'instrument')."
          }
      },
      "required": ["item_name"],
  },
)
tool_config = types.Tool(function_declarations=[get_image_declaration])

# 2. Send a message that triggers the tool
prompt = "Show me the instrument I ordered last month."
response_1 = client.models.generate_content(
  model="gemini-3-flash-preview",
  contents=[prompt],
  config=types.GenerateContentConfig(
      tools=[tool_config],
  )
)

# 3. Handle the function call
function_call = response_1.function_calls[0]
requested_item = function_call.args["item_name"]
print(f"Model wants to call: {function_call.name}")

# Execute your tool (e.g., call an API)
# (This is a mock response for the example)
print(f"Calling external tool for: {requested_item}")

function_response_data = {
  "image_ref": {"$ref": "instrument.jpg"},
}
image_path = "https://goo.gle/instrument-img"
image_bytes = requests.get(image_path).content
function_response_multimodal_data = types.FunctionResponsePart(
  inline_data=types.FunctionResponseBlob(
    mime_type="image/jpeg",
    display_name="instrument.jpg",
    data=image_bytes,
  )
)

# 4. Send the tool's result back
# Append this turn's messages to history for a final response.
history = [
  types.Content(role="user", parts=[types.Part(text=prompt)]),
  response_1.candidates[0].content,
  types.Content(
    role="user",
    parts=[
        types.Part.from_function_response(
          name=function_call.name,
          response=function_response_data,
          parts=[function_response_multimodal_data]
        )
    ],
  )
]

response_2 = client.models.generate_content(
  model="gemini-3-flash-preview",
  contents=history,
  config=types.GenerateContentConfig(
      tools=[tool_config],
      thinking_config=types.ThinkingConfig(include_thoughts=True)
  ),
)

print(f"\nFinal model response: {response_2.text}")
```

```python
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

class MatchResult(BaseModel):
    winner: str = Field(description="The name of the winner.")
    final_match_score: str = Field(description="The final match score.")
    scorers: List[str] = Field(description="The name of the scorer.")

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3.1-pro-preview",
    contents="Search for all details for the latest Euro.",
    config={
        "tools": [
            {"google_search": {}},
            {"url_context": {}}
        ],
        "response_format": {"text": {"mime_type": "application/json", "schema": MatchResult.model_json_schema()}},
    },  
)

result = MatchResult.model_validate_json(response.text)
print(result)
```

## TASK
Revise Gemini API usage according to the above code snippets. Upload the video clip and have Gemini return a structured output.
```

## Adding video to alert
```
Please ensure that the video file is attached to the video alert on the frontend and playable. Also ensure the AI's response message from video analysis is visible in the alert on the frontend. Please ensure the video sent to the server is only 10 fps and a scaled, low resolution (720p)
```