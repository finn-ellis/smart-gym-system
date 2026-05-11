# Data Store Buildout Prompt Plan

These prompts are sequenced so each later prompt depends on a locked contract
from the earlier prompts. They were checked against `docs/CS460 T05 Gym SAD.md`,
especially the component tables for Data & Analytics Engine, Wristband Handler,
Gym Management Portal Handler, Gym Management Portal App, the Data Stores
section, and Use Cases 1, 3, 4, 5, and 6.

## SAD Verification Summary

The SAD requires the following data-store-backed behavior:

- `Member Health Profiles` store member-disclosed health information and custom
  heart-rate thresholds for wristband monitoring.
- `Gym States Archive` stores historical periodic gym-state logs for analysis
  and portal queries.
- `Reports Archive` stores generated hourly/daily/weekly/monthly reports.
- `Video Clips Archive` stores abnormality video clips referenced by alerts.
- `Alert Log` stores alert records for portal querying and new-alert logging.
- `DataAnalyticsEngine` owns current `GymState`, writes historical state records,
  creates alerts, logs alerts, broadcasts gym-state changes, and dismisses
  action-required alerts.
- `GymManagementPortalHandler` exposes REST endpoints for alerts, reports,
  gym states, member profiles, video clips, wristband assignment, and wristband
  return.
- `WristbandHandler` owns `activeSessions` and `memberThresholds`, and reads
  thresholds from `Member Health Profiles` when pairing a wristband.

## Locked Contract From Prompts 1 And 2

Prompts 3-5 must assume the following outputs from Prompts 1 and 2. If an
implementation cannot meet these names exactly, it must update this file before
continuing so the dependency chain stays explicit.

### Backend Models

`smart-gym-system/src/datatypes.py` must expose these enums and aliases:

- `AlertSeverity`: `INFORMATIONAL`, `WARNING`, `CRITICAL`
- `ReportType`: `HOURLY`, `DAILY`, `WEEKLY`, `MONTHLY`
- `StatusLevel`: `NORMAL`, `WARNING`, `CRITICAL`
- `SensorId`, `WristbandId`, `ZoneId`, `MemberId`, `AlertId`, `ReportId`,
  `VideoClipId`

It must expose dataclasses with JSON-safe scalar/list/dict fields:

- `ThresholdConfig`
- `CustomizedHealthThresholds`
- `AirQualityReading`
- `EnvironmentalReading`
- `BiometricReading`
- `OccupancyCountsByZone`
- `AlertInfo`
- `GymState`
- `ReportInfo`
- `Report`
- `MemberProfile`
- `VideoClip`
- `MetricsLoad`

Every dataclass must be serializable by a shared helper:

- `to_jsonable(value: Any) -> Any`

The helper must convert dataclasses, enums, lists, and dictionaries into values
accepted by `flask.jsonify`.

### Frontend Models

`portal-app/src/types.ts` must mirror the backend JSON shape for every model
listed above. Enum string values must match backend enum JSON values exactly:

- `"Informational"`
- `"Warning"`
- `"Critical"`
- `"Hourly"`
- `"Daily"`
- `"Weekly"`
- `"Monthly"`
- `"Normal"`

### Required Field Shape

The model fields must support all SAD flows without later schema changes:

- `AlertInfo` includes `alert_id`, `severity`, `title`, `message`, `created_at`,
  `source`, `zone_id`, `member_id`, `wristband_id`, `sensor_id`,
  `video_clip_id`, `dismissed`, `dismissed_at`, and `details`.
- `GymState` includes `recorded_at`, `overall_status`, `air_quality`,
  `occupancy_by_zone`, `active_alerts`, and `zone_status`.
- `MemberProfile` includes `member_id`, `display_name`, `consent_to_monitoring`,
  `health_notes`, `emergency_contact`, `custom_thresholds`, and `updated_at`.
- `CustomizedHealthThresholds` includes warning/critical heart-rate bounds.
- `BiometricReading` includes `wristband_id`, `member_id`, `recorded_at`,
  `heart_rate_bpm`, and optional contextual metrics.
- `EnvironmentalReading` includes `sensor_id`, `zone_id`, `recorded_at`,
  `temperature_f`, `humidity_percent`, `co2_ppm`, `voc_index`, and
  `status`.
- `VideoClip` includes `clip_id`, `zone_id`, `recorded_at`, `duration_seconds`,
  `storage_uri`, `description`, and `metadata`.
- `ReportInfo` includes `report_id`, `report_type`, `title`, `period_start`,
  `period_end`, and `created_at`.
- `Report` includes every `ReportInfo` field plus `summary`, `metrics`, and
  referenced alert/state ids where practical.

### Backend Store API

`smart-gym-system/src/data_stores.py` must expose these store classes and a
factory:

- `MemberHealthProfiles`
- `GymStatesArchive`
- `ReportsArchive`
- `VideoClipsArchive`
- `AlertLog`
- `DataStores`
- `create_demo_data_stores() -> DataStores`

`DataStores` must group the concrete stores under these attributes:

- `member_profiles`
- `gym_states`
- `reports`
- `video_clips`
- `alerts`

Each store must provide predictable in-memory behavior:

- `get(id) -> model | None` for id-backed stores.
- `list(...) -> list[model]` for portal browsing.
- `upsert(model) -> model` where updates are expected.
- `add(model) -> model` where append-only logging is expected.

Specific required methods:

- `MemberHealthProfiles.get(member_id)`
- `MemberHealthProfiles.list()`
- `MemberHealthProfiles.upsert(profile)`
- `GymStatesArchive.latest()`
- `GymStatesArchive.list(start_at=None, end_at=None, limit=None)`
- `GymStatesArchive.add(state)`
- `ReportsArchive.get(report_id)`
- `ReportsArchive.list(report_type=None, start_at=None, end_at=None, limit=None)`
- `ReportsArchive.add(report)`
- `VideoClipsArchive.get(clip_id)`
- `VideoClipsArchive.list(zone_id=None, start_at=None, end_at=None, limit=None)`
- `VideoClipsArchive.add(clip)`
- `AlertLog.get(alert_id)`
- `AlertLog.list(severity=None, dismissed=None, zone_id=None, member_id=None,
  start_at=None, end_at=None, limit=None)`
- `AlertLog.add(alert)`
- `AlertLog.dismiss(alert_id, dismissed_at=None)`

The demo data created by `create_demo_data_stores()` must include at least:

- Two member profiles, one with custom thresholds and consent enabled.
- Three gym-state records, including one with an active warning or critical
  alert.
- One report.
- One video clip.
- Three alerts covering video, biometric, and environmental-style context.

## Prompt 1: Lock Core Datatypes

```md
Implement the locked backend and frontend data models for the Smart Gym System.

Read:
- AGENTS.md
- smart-gym-system/AGENTS.md
- portal-app/AGENTS.md
- docs/CS460 T05 Gym SAD.md
- prompts/data_store_buildout.prompt.md

Scope:
- smart-gym-system/src/datatypes.py
- portal-app/src/types.ts

Requirements:
- Follow the "Locked Contract From Prompts 1 And 2" section exactly.
- Replace placeholder/pass models with backend dataclasses and frontend
  TypeScript interfaces.
- Keep enum names and identifier aliases already present in the repo.
- Add `to_jsonable(value: Any) -> Any` in backend datatypes.
- Keep every field JSON-safe.
- Do not implement stores, Flask routes, or frontend screens in this prompt.

Verification:
- Run `python -m ruff check src` from `smart-gym-system/` when possible.
- Run `npm run build` from `portal-app/` when possible.
```

## Prompt 2: Lock In-Memory Data Stores

```md
Implement the locked in-memory data-store layer for the Smart Gym System.

Read:
- smart-gym-system/AGENTS.md
- smart-gym-system/src/datatypes.py
- smart-gym-system/src/data_stores.py
- docs/CS460 T05 Gym SAD.md
- prompts/data_store_buildout.prompt.md

Scope:
- smart-gym-system/src/data_stores.py

Requirements:
- Follow the backend store API in `prompts/data_store_buildout.prompt.md`
  exactly.
- Implement the five SAD stores:
  MemberHealthProfiles, GymStatesArchive, ReportsArchive, VideoClipsArchive,
  AlertLog.
- Add a `DataStores` container dataclass.
- Add `create_demo_data_stores() -> DataStores`.
- Use only in-memory dictionaries/lists.
- Do not introduce new dependencies.
- Include demo records required by the locked contract.
- Keep Flask route logic and business workflow logic out of this file.

Verification:
- Run `python -m ruff check src` from `smart-gym-system/` when possible.
```

## Prompt 3: Connect Backend Routes To Locked Stores

```md
Connect the Flask backend routes to the locked datatypes and data stores.

Read:
- smart-gym-system/AGENTS.md
- smart-gym-system/src/app.py
- smart-gym-system/src/gym_management_portal_handler.py
- smart-gym-system/src/data_analytics_engine.py
- smart-gym-system/src/wristband_handler.py
- smart-gym-system/src/data_stores.py
- smart-gym-system/src/datatypes.py
- prompts/data_store_buildout.prompt.md

Precondition:
- Prompt 1 and Prompt 2 are complete.
- Do not rename model fields or store methods from
  `prompts/data_store_buildout.prompt.md`.

Scope:
- smart-gym-system/src/gym_management_portal_handler.py
- smart-gym-system/src/data_analytics_engine.py
- smart-gym-system/src/wristband_handler.py
- smart-gym-system/src/app.py only if app-level wiring is needed

Requirements:
- Create shared app-level instances using `create_demo_data_stores()`.
- Implement these REST endpoints using the locked stores:
  GET `/api/alerts`
  GET `/api/alerts/<alert_id>`
  POST `/api/alerts/<alert_id>/dismiss`
  GET `/api/reports`
  GET `/api/reports/<report_id>`
  GET `/api/gym_states`
  GET `/api/members`
  GET `/api/members/<member_id>`
  PUT/PATCH `/api/members/<member_id>`
  GET `/api/videos/<clip_id>`
  POST `/api/wristbands/assign`
  POST `/api/wristbands/return`
- Use `to_jsonable` for every JSON response containing dataclasses/enums.
- Validate required payload fields.
- Return 400 for invalid input and 404 for missing records.
- Implement `DataAnalyticsEngine.dismissAlert` so it calls
  `AlertLog.dismiss`, removes the alert from current `GymState.active_alerts`,
  archives the updated state, and broadcasts the new gym state.
- Implement `WristbandHandler.pairWristband` and `unpairWristband` using
  `MemberHealthProfiles` and the existing `activeSessions` /
  `memberThresholds` state.
- Keep route handlers thin.

Verification:
- Run `python -m ruff check src` from `smart-gym-system/`.
- Use Flask test-client checks or concise manual curl notes for:
  listing alerts, viewing an alert, dismissing an alert, listing gym states,
  viewing/updating a member, assigning a wristband, and returning a wristband.
```

## Prompt 4: Connect Portal Frontend To Locked API

```md
Connect the React portal app to the locked backend API.

Read:
- portal-app/AGENTS.md
- portal-app/src/*.tsx
- portal-app/src/types.ts
- prompts/data_store_buildout.prompt.md

Precondition:
- Prompts 1-3 are complete.
- The frontend must use the TypeScript model names and fields locked in
  `prompts/data_store_buildout.prompt.md`.

Scope:
- portal-app/src/services/ or portal-app/src/utils/ for API helpers
- portal-app/src/AlertsDashboard.tsx
- portal-app/src/GymStateDashboard.tsx
- portal-app/src/MemberProfiles.tsx
- portal-app/src/WristbandManagement.tsx
- portal-app/src/ReportBrowsing.tsx
- portal-app/src/App.css if needed

Requirements:
- Add a small typed fetch API client.
- Render real backend data for alerts, gym states, members, reports, and
  wristband actions.
- Implement alert dismissal via POST `/api/alerts/<alert_id>/dismiss`.
- Implement member profile browsing and updating.
- Implement wristband assignment and return forms.
- Add loading, empty, and error states.
- Keep the UI demo-focused and practical.
- Do not add a state-management library.
- Do not change backend field names to fit the UI; adapt the UI to the locked
  API contract.

Verification:
- Run `npm run build` from `portal-app/`.
```

## Prompt 5: Update Documentation And Prompt Log

```md
Update project documentation after the data stores and integration work.

Read:
- TODO.md
- prompts/MASTER_PROMPT_LOG.md
- prompts/data_store_buildout.prompt.md
- docs/CS460 T05 Gym SAD.md
- AGENTS.md

Precondition:
- Prompts 1-4 are complete.

Scope:
- TODO.md
- prompts/MASTER_PROMPT_LOG.md
- Add or update README documentation only if one already exists or is needed
  for running the demo.
- Do not rewrite the SAD wholesale.

Requirements:
- Mark completed items related to:
  Data Stores
  Gym Management Portal Handler route implementation
  Gym Management Portal App data integration
  UC3, UC4, and UC5 if implemented
- Add a short implementation note explaining that stores are currently
  in-memory demo stores.
- Add backend run instructions.
- Add frontend run instructions.
- Add sample API endpoints for manual verification.
- Add known limitations/future work, especially persistent database migration,
  push notifications, real hardware, and omitted demo components.
- Keep docs concise and link to the SAD instead of duplicating it.

Verification:
- Confirm docs reference accurate commands:
  `python -m ruff check src` from `smart-gym-system/`
  `npm run build` from `portal-app/`
```
