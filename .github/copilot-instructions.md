# SmartGymSystem Project Guidelines

## Behavioral Guidelines
Please closely follow the core autonomous coding guidelines outlined in [`GUIDELINES.prompt.md`](GUIDELINES.prompt.md). Key principles include:
- **Think Before Coding**: State your assumptions explicitly and surface tradeoffs before implementation.
- **Simplicity First**: Write the minimum code that solves the problem. Avoid speculative features.
- **Surgical Changes**: Touch only what you must and match existing style. Clean up any unused code created by your changes.
- **Goal-Driven Execution**: Transform tasks into verifiable goals and loop until verified.

## Architecture
- `portal-app/`: Frontend application directory.
- `smart-gym-system/`: Backend/core logic directory (Python based).

## Build and Test
- **Dependencies**: Backend requirements are maintained in `smart-gym-system/requirements.txt`.
- Further build and test instructions will be added as the project infrastructure is completely scaffolded.

## Conventions
- **Link, don't embed**: Reference internal documentation rather than duplicating it.
