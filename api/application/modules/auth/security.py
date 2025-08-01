import datetime
from typing import Union
from jose import jwt
from passlib.context import CryptContext
from starlette import status
from starlette.requests import Request
from application.modules.database.database_models import PublicKeys
from application.modules.schemas.response_schemas import GeneralException
from application.modules.utils.settings import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: Union[int, datetime.timedelta] = None) -> str:
    settings = get_settings()

    to_encode = data.copy()

    if isinstance(expires_delta, int):
        expire = datetime.datetime.now() + datetime.timedelta(minutes=expires_delta)
    elif isinstance(expires_delta, datetime.timedelta):
        expire = datetime.datetime.now() + expires_delta
    else:
        expire = datetime.datetime.now() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES or 60)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def verify_public_key(request: Request):
    key = request.headers.get("x-public-api-key")
    if not key:
        raise GeneralException(
            is_ok=False,
            status_code=status.HTTP_401_UNAUTHORIZED,
            exception="Der öffentliche Schlüssel fehlt.",
            status="PUB_KEY_MISSING"
        )

    db_key = await PublicKeys.find_one(PublicKeys.key == key, PublicKeys.isActive == True)
    if not db_key:
        raise GeneralException(
            is_ok=False,
            status_code=status.HTTP_401_UNAUTHORIZED,
            exception="Der öffentliche Schlüssel wurde entweder nicht gefunden oder ist nicht aktiv.",
            status="PUB_KEY_MISSING"
        )

    if db_key.is_expired():
        raise GeneralException(
            is_ok=False,
            status_code=status.HTTP_401_UNAUTHORIZED,
            exception="Der öffentliche Schlüssel is abgelaufen.",
            status="PUB_KEY_MISSING"
        )

    if db_key.allowedIps:
        client_ip = request.client.host
        if client_ip not in db_key.allowedIps:
            raise GeneralException(
                is_ok=False,
                status_code=status.HTTP_401_UNAUTHORIZED,
                exception="Die, im Header übermittelte, IP ist für diesen Schlüssel nicht gültig.",
                status="PUB_KEY_MISSING"
            )

    db_key.last_used_at = datetime.datetime.now()
    await db_key.save()
