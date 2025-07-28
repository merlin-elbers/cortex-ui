from starlette.requests import Request
import datetime
from application.modules.database.database_models import Logins, LoginStatus


async def log_login_attempt(request: Request, user_uid: str, login_status: LoginStatus):
    log = Logins(
        userUid=user_uid,
        timestamp=datetime.datetime.now(),
        ipAddress=request.headers.get("x-forwarded-for", request.client.host),
        userAgent=request.headers.get("user-agent", "unknown"),
        status=login_status
    )
    await log.create()