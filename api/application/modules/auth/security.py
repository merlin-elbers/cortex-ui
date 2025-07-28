import datetime
from typing import Union
from jose import jwt
from passlib.context import CryptContext
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
