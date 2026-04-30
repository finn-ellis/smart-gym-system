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

## Style

- Use the existing styling approach unless the project deliberately adopts
  another one.
- Destructure props and state where it improves readability.
- Prefer early returns for conditional rendering over deeply nested ternaries.
- Keep `useEffect`, `useCallback`, and `useMemo` dependency arrays accurate.

## Verification

- Run `npm run build` from `portal-app/` after frontend changes when practical.
