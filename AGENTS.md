# Smart Gym System Codex Instructions

These instructions apply to the entire repository unless a more specific
`AGENTS.md` exists in a subdirectory.

## Project Layout

- `portal-app/`: React 18 + Vite frontend application.
- `smart-gym-system/`: Python backend and core system logic.
- `.github/GUIDELINES.prompt.md`: long-form autonomous coding guidance that
  should stay aligned with these instructions.

## Working Principles

- Think before coding. State assumptions, surface important tradeoffs, and ask
  when the task cannot be safely inferred from the repository.
- Keep changes simple. Write the minimum code needed for the requested behavior
  and avoid speculative features or abstractions.
- Make surgical edits. Touch only the files needed for the task, preserve local
  style, and clean up only unused code created by the current change.
- Work toward verifiable goals. For non-trivial changes, identify how the change
  will be checked, then run the relevant check when practical.
- Link to internal documentation instead of duplicating large sections of it.

## Build and Test

- Frontend build: run `npm run build` from `portal-app/`.
- Frontend dev server: run `npm run dev` from `portal-app/`.
- Backend dependencies are listed in `smart-gym-system/requirements.txt`.
- Backend lint check: run `python -m ruff check src` from `smart-gym-system/`
  after backend changes when dependencies are available.

## Repository Conventions

- Follow the most specific `AGENTS.md` for the files being edited.
- Do not remove the existing Copilot instruction files unless explicitly asked;
  they may still be useful for other tools.
- Prefer existing patterns in the repository over introducing new structure.
