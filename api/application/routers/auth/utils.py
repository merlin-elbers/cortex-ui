from passlib.context import CryptContext
import datetime
from jose import jwt, JWTError
from starlette.requests import Request
from application.modules.database.database_models import User, UserRole, Logins, LoginStatus
from application.modules.schemas.response_schemas import GeneralException
from application.modules.utils.settings import get_settings
from application.routers.auth.dependencies import oauth2_scheme
from fastapi import Depends, status
from typing import Union, List

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user = await User.find_one(User.uid == payload.get('uid'))
        if not user or not user.isActive:
            raise GeneralException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                status="UNAUTHORIZED",
                exception="User not found or not active anymore.",
                is_ok=False
            )

    except JWTError:
        raise GeneralException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            status="UNAUTHORIZED",
            exception="Token is invalid.",
            is_ok=False
        )

    return user


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


def verify_token(token: str) -> Union[dict, None]:
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def require_role(required_roles: Union[str, UserRole, List[Union[str, UserRole]]]):
    if not isinstance(required_roles, list):
        required_roles = [required_roles]

    resolved_roles: List[UserRole] = []
    for r in required_roles:
        if isinstance(r, str):
            try:
                r_enum = UserRole[r]
            except KeyError:
                raise ValueError(f"Ungültige Rolle: '{r}' (nicht im Enum)")
            resolved_roles.append(r_enum)
        elif isinstance(r, UserRole):
            resolved_roles.append(r)
        else:
            raise TypeError("Ungültiger Rollentyp. Nur str oder UserRole erlaubt.")

    min_required_level = max(role.level for role in resolved_roles)

    async def checker(user: User = Depends(get_current_user)):

        try:
            role_enum = UserRole.viewer
            for role in UserRole:
                if str(role) == user.role:
                    role_enum = UserRole(role)
        except ValueError:
            raise GeneralException(
                status_code=status.HTTP_403_FORBIDDEN,
                status="FORBIDDEN",
                exception=f"Ungültige Rolle im Benutzerobjekt: {user.role}",
                is_ok=False
            )
        if role_enum.level < min_required_level:
            raise GeneralException(
                status_code=status.HTTP_403_FORBIDDEN,
                status="FORBIDDEN",
                exception=f"Zugriff erfordert mindestens eine der Rollen: {[role.label for role in resolved_roles]}",
                is_ok=False
            )

        return user

    return checker


async def log_login_attempt(request: Request, user_uid: str, login_status: LoginStatus):
    log = Logins(
        userUid=user_uid,
        timestamp=datetime.datetime.now(),
        ipAddress=request.headers.get("x-forwarded-for", request.client.host),
        userAgent=request.headers.get("user-agent", "unknown"),
        status=login_status
    )
    await log.create()
