---
description: "Use when working on the portal-app frontend, implementing React components, setting up Vite plugins, or handling frontend state and routing."
applyTo: "portal-app/**"
---

# Frontend Guidelines (React + Vite)

## Core Principles
1. **Lightweight and Fast**: Rely on Vite's fast HMR. Avoid heavy abstractions. Keep components simple and focused.
2. **Modern React**: Use functional components with Hooks exclusively. No class components.
3. **State Management**: Prefer local component state (`useState`, `useReducer`) or React Context for simple global state. Do not introduce heavy state libraries unless complexity demands it.
4. **Styling**: Stick to a simple and maintainable strategy (e.g., CSS Modules or Tailwind CSS depending on project setup). Keep styles coupled closely to components.

## Development Workflow
- **Clean Architecture**: Place reusable UI components in `portal-app/src/components` and page-level components in `portal-app/src/pages`.
- **API Communication**: Colocate API calls and data fetching logic intelligently. Use standard lightweight data fetching (e.g., standard `fetch` or a lightweight hook) inside a dedicated `utils` or `services` folder.
- **Strict Typing**: Always use TypeScript and `.tsx` extensions for React components. Define clear and strict interfaces for component props and API responses.

## Code Style
- **Destructing**: Always destructure props and state for cleaner code.
- **Early Returns**: Use early returns for conditional rendering instead of deeply nested ternaries.
- **Dependency Arrays**: Always accurately specify dependencies in `useEffect` and `useCallback` to prevent stale closures and infinite loops.
