1. Ran `system_scaffolding.prompt.md`
2)
> **Precondition**
> /create-instructions Edit #file:frontend.instructions.md and clarify that frontend should be written using TypeScript `tsx`.
>
> **Task**
> Refactor frontend to use `tsx` and typescript instead of `jsx`.
3)
> Setup VITE and typescript enviroment for the frontend in #file:portal-app 
4)
> Setup a central Flask structure in #file:smart-gym-system 
> - Create `__init__.py` and `appy.py`with basic Flask development structure
> - Keep components the same (**this is required by project structure**), but add blueprint structure compatibility so that #file:gym_management_portal_handler.py can implement client routes
> - Change structure such that #file:iot_gateway.py may define routes that will be used for iot device connectivity
> - Add functionality to #file:data_analytics_engine.py to host a web socket for broadcasting gym state to client apps.
>
> **Requirements:**
> - Use a strict TODO to keep on track with these changes