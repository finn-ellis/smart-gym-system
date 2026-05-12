# Frontend Codex Instructions

These instructions apply to files under `portal-app/`.

## Stack

- React 18
- Vite
- TypeScript
- React Router

## Frontend Principles

- Use functional React components with Hooks. Do not add class components.
- Keep components focused and lightweight. Avoid heavy abstractions unless the
  local complexity clearly justifies them.
- Prefer local component state, `useReducer`, or React Context for simple shared
  state. Do not introduce a large state-management library unless requested or
  clearly necessary.
- Use TypeScript for new React code and keep component files as `.tsx`.
- Define clear interfaces or types for component props and API responses.

## Structure

- Preserve the existing file layout when making small changes.
- When adding new reusable UI pieces, prefer `src/components/`.
- When adding new page-level views, prefer `src/pages/`.
- When adding API or data-fetching helpers, prefer a focused `src/services/` or
  `src/utils/` module.

## Backend Data Store API

The frontend never imports, instantiates, or mirrors backend data stores
directly. Portal data access goes through REST APIs exposed by the Flask backend
and typed wrappers in `src/services/portalApi.ts`.

| Backend route | Backend store/component | Frontend wrapper |
| --- | --- | --- |
| `GET /api/alerts` | `AlertLog.get_alerts` | `getAlerts()` |
| `GET /api/alerts/<alert_id>` | `AlertLog.get_alert` | `viewAlert(alertId)` |
| `POST /api/alerts/<alert_id>/dismiss` | `DataAnalyticsEngine.dismissAlert` and `AlertLog.dismiss_alert` | `dismissAlert(alertId)` |
| `GET /api/reports` | `ReportsArchive.list_reports` | `getReports()` |
| `GET /api/reports/<report_id>` | `ReportsArchive.get_report` | `viewReport(reportId)` |
| `GET /api/gym_states` | `GymStatesArchive.get_latest` / `get_range` | `getGymStates()` |
| `GET /api/members/<member_id>` | `MemberHealthProfiles.get_profile` | `getMemberProfile(memberId)` |
| `PUT/PATCH /api/members/<member_id>` | `MemberHealthProfiles.update_profile` | `updateMemberProfile(memberId, profileData)` |
| `GET /api/videos/<clip_id>` | `VideoClipsArchive.get_clip` | `getVideoClip(clipId)` |
| `POST /api/wristbands/assign` | `WristbandHandler.pairWristband` | `assignWristband(...)` |
| `POST /api/wristbands/return` | `WristbandHandler.unpairWristband` | `onWristbandReturned(wristbandId)` |

Before adding a new fetch call, check `src/services/portalApi.ts` and the
backend portal routes for an existing route/wrapper pair. Reuse or extend the
existing wrapper when practical instead of creating duplicate fetch logic in a
component.

## Style

- Use the existing styling approach unless the project deliberately adopts
  another one.
- Destructure props and state where it improves readability.
- Prefer early returns for conditional rendering over deeply nested ternaries.
- Keep `useEffect`, `useCallback`, and `useMemo` dependency arrays accurate.

## Verification

- Run `npm run build` from `portal-app/` after frontend changes when practical.
