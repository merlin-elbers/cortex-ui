from fastapi import Request
from starlette import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp
from application.modules.utils.settings import get_settings
import re


class SetupGuardMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()

        if settings.SETUP_COMPLETED:
            return await call_next(request)

        allowed_paths = [
            ("GET", re.compile(r"^/docs/?$")),
            ("GET", re.compile(r"^/redoc/?$")),
            ("GET", re.compile(r"^/openapi.json/?$")),
            ("GET", re.compile(rf"^{settings.API_PREFIX}/system/ping/?$")),
            ("GET", re.compile(rf"^{settings.API_PREFIX}/setup/status/?$")),
            ("POST", re.compile(rf"^{settings.API_PREFIX}/setup/complete?$")),
            ("OPTIONS", re.compile(rf"^{settings.API_PREFIX}/setup/complete?$")),
            ("POST", re.compile(rf"^{settings.API_PREFIX}/system/token/?$")),
            ("OPTIONS", re.compile(rf"^{settings.API_PREFIX}/system/token/?$")),
        ]

        for method, path_regex in allowed_paths:
            if request.method == method and path_regex.match(request.url.path):
                return await call_next(request)
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "isOk": False,
                "status": "SETUP_REQUIRED",
                "message": "Das Setup muss abgeschlossen werden, bevor diese Route aufgerufen werden kann.",
                "requestedUrl": str(request.url)
            }
        )
