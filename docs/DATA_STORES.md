# Smart Gym Data Stores

## Overview

The Smart Gym System Architecture Design (SAD) defines five data stores used by
the backend and portal:

- `MemberHealthProfiles`
- `GymStatesArchive`
- `AlertLog`
- `ReportsArchive`
- `VideoClipsArchive`

The current implementation is intentionally in-memory for the CS460 demo. Store
instances live for the lifetime of the Flask application process, use Python
`dict` and `list` containers, and are not persisted across restarts.

## Store Reference

### `MemberHealthProfiles`

Purpose: stores member-disclosed profile information and customized biometric
thresholds used by the wristband flow.

Public methods:

```python
def get_profile(member_id: MemberId) -> MemberProfile
def update_profile(member_id: MemberId, data: dict[str, Any]) -> MemberProfile
def list_profiles() -> list[MemberProfile]
```

Readers and writers:

| Operation | Writer | Readers |
| --- | --- | --- |
| Profile seed data | `create_app()` | Portal routes, `WristbandHandler` |
| Profile update | `GymManagementPortalHandler.updateMemberProfile` | `WristbandHandler.pairWristband`, profile route |

### `GymStatesArchive`

Purpose: stores historical periodic `GymState` snapshots for the portal and
future report generation.

Public methods:

```python
def append(gym_state: GymState) -> GymState
def get_range(start: float, end: float) -> list[GymState]
def get_latest() -> Optional[GymState]
```

Readers and writers:

| Operation | Writer | Readers |
| --- | --- | --- |
| Periodic snapshots | `DataAnalyticsEngine` daemon thread | `GymManagementPortalHandler.getGymStates` |
| Latest state lookup | N/A | Portal route and future reporting |

The archive caps itself at `10000` entries.

### `AlertLog`

Purpose: stores staff-facing alerts produced by the Data & Analytics Engine and
supports portal alert browsing, detail view, filtering, and dismissal.

Public methods:

```python
def add_alert(alert: AlertInfo) -> AlertInfo
def get_alert(alert_id: AlertId) -> AlertInfo
def get_alerts(
    start: Optional[float] = None,
    end: Optional[float] = None,
    limit: int = 100,
) -> list[AlertInfo]
def dismiss_alert(alert_id: AlertId) -> AlertInfo
```

Readers and writers:

| Operation | Writer | Readers |
| --- | --- | --- |
| Add alert | `DataAnalyticsEngine.onSensorProcess`, `onBiometricAlert`, `onVideoAlert` | Portal alert routes, future reports |
| Dismiss alert | `DataAnalyticsEngine.dismissAlert` | Portal alert routes |

### `ReportsArchive`

Purpose: stores generated routine management reports.

Public methods:

```python
def save_report(report: Report) -> Report
def get_report(report_id: ReportId) -> Report
def list_reports(limit: int = 50) -> list[Report]
```

Readers and writers:

| Operation | Writer | Readers |
| --- | --- | --- |
| Save report | `ReportGenerationHandler.compileReport` | `GymManagementPortalHandler.getReports`, `viewReport` |

### `VideoClipsArchive`

Purpose: stores abnormality clips referenced by alerts and reports.

Public methods:

```python
def save_clip(clip: VideoClip) -> VideoClip
def get_clip(clip_id: VideoClipId) -> VideoClip
```

Readers and writers:

| Operation | Writer | Readers |
| --- | --- | --- |
| Save clip | `MLLMHandler.save_placeholder_clip` | `GymManagementPortalHandler.getVideoClip` |

## Singleton Wiring

The stores are singleton-per-app-process demo objects. Instantiate them once in
`smart-gym-system/src/app.py:create_app()` and pass them through constructors:

```python
member_health_profiles = MemberHealthProfiles([...])
gym_states_archive = GymStatesArchive()
alert_log = AlertLog()
reports_archive = ReportsArchive()
video_clips_archive = VideoClipsArchive()

analytics_engine = DataAnalyticsEngine(gym_states_archive, alert_log, socketio)
wristband_handler = WristbandHandler(
    member_health_profiles,
    iot_gateway,
    analytics_engine,
)
report_generation_handler = ReportGenerationHandler(reports_archive)
mllm_handler = MLLMHandler(video_clips_archive, analytics_engine)

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
    url_prefix="/api",
)
```

Do not create store instances at module import time, inside route functions, or
inside frontend code. Frontend code accesses stored data only through REST API
wrappers.

## Thread Safety

Each store owns a `threading.Lock` and guards mutations with that lock. This is
important because wristband polling and gym-state snapshot logging run in daemon
threads while Flask routes may read or mutate the same stores.

Rules:

- Keep all store writes and read-modify-write operations inside the store's
  lock.
- Use only public store methods from callers.
- Do not expose or mutate private attributes such as `_profiles`, `_states`,
  `_alerts`, `_reports`, or `_clips` from outside `data_stores.py`.
- Keep long-running work outside store locks; compute data before calling the
  public store write method.

## Adding a New Store Checklist

1. Confirm the need against `docs/CS460 T05 Gym SAD.md`.
2. Add minimal datatypes in `smart-gym-system/src/datatypes.py` only if the
   current datatypes cannot represent the stored records.
3. Implement the store in `smart-gym-system/src/data_stores.py` with in-memory
   `dict`/`list` state and `threading.Lock`.
4. Add public methods with docstrings and descriptive `KeyError` or `ValueError`
   failures.
5. Instantiate the store once in `create_app()`.
6. Inject the store through constructors into the components that need it.
7. Expose data through a backend handler or route; do not let the frontend talk
   to stores directly.
8. Add or update frontend wrappers in `portal-app/src/services/portalApi.ts`
   only after checking for an existing route.
9. Update this document and the relevant `AGENTS.md` guidance.
10. Run `python -m ruff check src` from `smart-gym-system/`.

## Known Limitations

- All stores are in-memory and process-local; data is lost when the Flask
  process restarts.
- There is no cross-process coordination, so multiple app workers would not
  share store state.
- Regulatory requirements in the SAD, such as encrypted storage and video
  retention/purging, are not implemented by these demo stores.
- `GymStatesArchive` keeps only the latest `10000` entries.
- Report and video clip creation are placeholder demo flows until the full
  MLLM, report generation, and storage integrations are expanded.
