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
