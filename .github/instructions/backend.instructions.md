---
description: "Use when working on the smart-gym-system backend, implementing Python APIs, services, or domain logic."
applyTo: "smart-gym-system/**"
---

# Backend Guidelines (Python)

## Core Principles
1. **Strict Typing**: Always use Python type hints (e.g., from `typing` or `collections.abc`) for function signatures, variables, and class attributes. Code should be written as if validated by a strict type checker (like `mypy` or `pyright`).
2. **Minimal Dependencies**: Rely on the Python standard library whenever possible. Only introduce third-party packages when the complexity strictly demands it, and ensure they are added to `requirements.txt`.
3. **Clean Architecture**: Strongly separate business logic from the web framework. Route handlers should be thin, delegating core logic to a dedicated service layer.

## API Conventions (FastAPI / Flask)
- **Thin Routes**: Route functions should only handle HTTP concerns: parsing input, invoking a service, and returning a formatted response.
- **Validation**: Use robust validation (e.g., Pydantic models if using FastAPI) for all incoming API requests and outgoing responses.
- **Error Handling**: Use centralized error handling/middleware rather than repeating large `try/except` blocks across individual endpoints.

## Code Style
- **Pythonic Idioms**: Follow PEP 8 convention. Leverage list comprehensions, context managers (`with`), and generator expressions where appropriate.
- **Documentation**: Write clear, concise docstrings (e.g., Google style) for public modules, classes, and functions, focusing on the *why* rather than restating the *what*.
