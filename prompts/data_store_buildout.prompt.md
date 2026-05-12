# Data Store Buildout Prompt Plan

This prompt plan tracks the CS460 Smart Gym data-store buildout against
`docs/CS460 T05 Gym SAD.md`. It should stay aligned with the current backend
source in `smart-gym-system/src/` and with `docs/DATA_STORES.md`.

## SAD Verification Summary

The SAD requires these data-store-backed behaviors:

- `Member Health Profiles` store member-disclosed health information and custom
  thresholds for wristband monitoring.
- `Gym States Archive` stores historical periodic gym-state logs for portal
  queries and future analytics.
- `Reports Archive` stores generated routine reports.
- `Video Clips Archive` stores abnormality clips referenced by alerts and
  reports.
- `Alert Log` stores alert records for portal querying and new-alert logging.
- `DataAnalyticsEngine` owns current `GymState`, produces and dismisses alerts,
  writes to the alert log, broadcasts state changes, and snapshots gym state.
- `GymManagementPortalHandler` exposes REST endpoints for alerts, reports, gym
  states, member profiles, video clips, wristband assignment, and wristband
  return.
- `WristbandHandler` reads `MemberHealthProfiles` when pairing a wristband and
  stores personalized thresholds for the active session.

## Current Backend Store API

`smart-gym-system/src/data_stores.py` exposes five in-memory stores:

- `MemberHealthProfiles`
- `GymStatesArchive`
- `ReportsArchive`
- `VideoClipsArchive`
- `AlertLog`

Current public methods:

```python
MemberHealthProfiles.get_profile(member_id)
MemberHealthProfiles.update_profile(member_id, data)
MemberHealthProfiles.list_profiles()

GymStatesArchive.append(gym_state)
GymStatesArchive.get_range(start, end)
GymStatesArchive.get_latest()

AlertLog.add_alert(alert)
AlertLog.get_alert(alert_id)
AlertLog.get_alerts(start=None, end=None, limit=100)
AlertLog.dismiss_alert(alert_id)

ReportsArchive.save_report(report)
ReportsArchive.get_report(report_id)
ReportsArchive.list_reports(limit=50)

VideoClipsArchive.save_clip(clip)
VideoClipsArchive.get_clip(clip_id)
```

## Current Integration Requirements

- Instantiate each store once in `smart-gym-system/src/app.py:create_app()`.
- Seed `MemberHealthProfiles` in `create_app()` with at least two demo users.
- Inject store instances through constructors only.
- Keep stores in-memory and guarded by `threading.Lock`.
- Route backend REST access through `GymManagementPortalHandler`.
- Route frontend data access through `portal-app/src/services/portalApi.ts`.
- Do not create module-level store singletons.

## Prompt Sequence

### Prompt 1: Lock Core Datatypes

Read:

- `AGENTS.md`
- `smart-gym-system/AGENTS.md`
- `portal-app/AGENTS.md`
- `docs/CS460 T05 Gym SAD.md`
- `prompts/data_store_buildout.prompt.md`

Scope:

- `smart-gym-system/src/datatypes.py`
- `portal-app/src/types.ts`

Requirements:

- Replace placeholder backend datatypes with minimal dataclasses needed by the
  current codebase.
- Keep enum names and identifier aliases already present in the repo.
- Keep fields JSON-safe.
- Do not implement stores, Flask routes, or frontend screens in this prompt.

Verification:

- Run `python -m ruff check src` from `smart-gym-system/` when possible.
- Run `npm run build` from `portal-app/` when possible after frontend model
  changes.

### Prompt 2: Implement In-Memory Data Stores

Read:

- `smart-gym-system/AGENTS.md`
- `smart-gym-system/src/datatypes.py`
- `smart-gym-system/src/data_stores.py`
- `docs/CS460 T05 Gym SAD.md`
- `prompts/data_store_buildout.prompt.md`

Scope:

- `smart-gym-system/src/data_stores.py`

Requirements:

- Implement the five SAD stores.
- Use only in-memory dictionaries and lists.
- Protect store mutations with `threading.Lock`.
- Keep Flask route logic and business workflow logic out of this file.
- Add clear public method docstrings.

Verification:

- Run `python -m ruff check src` from `smart-gym-system/` when possible.

### Prompt 3: Connect Backend Routes To Stores

Read:

- `smart-gym-system/AGENTS.md`
- `smart-gym-system/src/app.py`
- `smart-gym-system/src/gym_management_portal_handler.py`
- `smart-gym-system/src/data_analytics_engine.py`
- `smart-gym-system/src/wristband_handler.py`
- `smart-gym-system/src/data_stores.py`
- `smart-gym-system/src/datatypes.py`
- `prompts/data_store_buildout.prompt.md`

Scope:

- Backend composition and handlers under `smart-gym-system/src/`.

Requirements:

- Instantiate all stores once in `create_app()`.
- Inject stores through constructors.
- Implement route handlers for alerts, reports, gym states, member profiles,
  video clips, wristband assignment, and wristband return.
- Implement `DataAnalyticsEngine` alert creation, dismissal, broadcasting, and
  five-minute gym-state snapshots.
- Keep route handlers thin.

Verification:

- Run `python -m ruff check src` from `smart-gym-system/`.

### Prompt 4: Connect Portal Frontend To Backend API

Read:

- `portal-app/AGENTS.md`
- `portal-app/src/*.tsx`
- `portal-app/src/types.ts`
- `portal-app/src/services/portalApi.ts`
- `prompts/data_store_buildout.prompt.md`

Scope:

- Frontend API wrappers and portal views.

Requirements:

- Use `portal-app/src/services/portalApi.ts` for backend access.
- Render backend data for alerts, gym states, members, reports, videos, and
  wristband actions.
- Add loading, empty, and error states.
- Do not let frontend code access backend stores directly.

Verification:

- Run `npm run build` from `portal-app/`.

### Prompt 5: Update Documentation And Prompt Log

Read:

- `prompts/MASTER_PROMPT_LOG.md`
- `prompts/data_store_buildout.prompt.md`
- `docs/CS460 T05 Gym SAD.md`
- `AGENTS.md`

Scope:

- Documentation and prompt files only.

Requirements:

- Document the in-memory demo stores.
- Document singleton wiring through `create_app()`.
- Document REST route access from the frontend.
- Add known limitations/future work.
- Keep docs concise and link to the SAD instead of rewriting it.

Verification:

- Confirm docs reference accurate commands:
  `python -m ruff check src` from `smart-gym-system/`
  `npm run build` from `portal-app/`

## Result

The data-store implementation now follows the SAD's five-store structure:

- `MemberHealthProfiles` supports profile lookup, updates, and listing.
- `GymStatesArchive` supports append, latest lookup, range lookup, and caps
  history at `10000` entries.
- `AlertLog` supports add, lookup, optional time-range listing with a limit, and
  dismissal.
- `ReportsArchive` supports saving, lookup, and recent listing.
- `VideoClipsArchive` supports saving and lookup.

`create_app()` is the application composition root. It creates one instance of
each store, seeds two demo member profiles, injects the stores through
constructors, and registers portal routes that read from the stores. The
frontend accesses these stores only through REST wrappers in
`portal-app/src/services/portalApi.ts`.

Known implementation limits remain intentional for the demo: stores are
in-memory, process-local, not encrypted, not durable across restart, and not yet
backed by a persistent database or production video retention policy.
