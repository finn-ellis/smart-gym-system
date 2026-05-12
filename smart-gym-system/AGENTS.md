# Backend Codex Instructions

These instructions apply to files under `smart-gym-system/`.

## Stack

- Python
- Flask
- Flask-SocketIO
- Ruff

## Backend Principles

- Use Python type hints for function signatures, variables, and class
  attributes where practical.
- Prefer the standard library before adding third-party dependencies.
- If a new backend dependency is needed, add it to `requirements.txt`.
- Keep Flask routes and SocketIO event handlers thin. They should parse input,
  delegate business logic, and format responses.
- Keep business logic in dedicated modules or service-style functions instead
  of embedding it in route handlers.

## Data Store Usage Rules

Import concrete stores from `src.data_stores` only where a component needs a
constructor type hint or `create_app()` needs to instantiate the store:

```python
from .data_stores import AlertLog, GymStatesArchive
```

Use constructor injection for every store dependency. Components should accept
the store in `__init__`, assign it to an instance attribute, and call public
methods on that injected object:

```python
class DataAnalyticsEngine:
    def __init__(
        self,
        gym_states_archive: GymStatesArchive,
        alert_log: AlertLog,
    ) -> None:
        self._gym_states_archive = gym_states_archive
        self._alert_log = alert_log
```

Store ownership and readers:

| Store | Primary writer or owner | Readers |
| --- | --- | --- |
| `MemberHealthProfiles` | `GymManagementPortalHandler.updateMemberProfile` | `GymManagementPortalHandler`, `WristbandHandler` |
| `GymStatesArchive` | `DataAnalyticsEngine` snapshot thread | `GymManagementPortalHandler.getGymStates`, report generation |
| `AlertLog` | `DataAnalyticsEngine` alert methods and dismissal | `GymManagementPortalHandler`, report generation |
| `ReportsArchive` | `ReportGenerationHandler` | `GymManagementPortalHandler` |
| `VideoClipsArchive` | `MLLMHandler` | `GymManagementPortalHandler`, alerts and reports |

All new stores must be wired through `src/app.py:create_app()`: instantiate the
store once there, pass it through constructors, and expose behavior through
handlers or routes. Do not create module-level store singletons or instantiate
stores inside request handlers.

## API Conventions

- Validate incoming request data and outgoing response shapes explicitly.
- Prefer centralized error handling patterns over repeating large `try`/`except`
  blocks across endpoints.
- Keep blueprint registration and application setup in the application factory
  pattern used by `src/app.py`.

## Style

- Follow PEP 8 and the existing local style.
- Write concise docstrings for public modules, classes, and functions when the
  reason for the code is not obvious.
- Focus docstrings and comments on why a decision exists, not on restating what
  the code already says.

## Verification

- Run `python -m ruff check src` from `smart-gym-system/` after backend changes
  when dependencies are available.
