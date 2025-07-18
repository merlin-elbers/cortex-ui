from passlib.context import CryptContext
import datetime
import os
from typing import Union
from dotenv import load_dotenv
from fastapi import Depends
from jose import jwt, JWTError
from starlette import status
from application.modules.database_models import User
from application.modules.schemas.response_schemas import GeneralException
from application.routers.auth.dependencies import oauth2_scheme

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    load_dotenv()

    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
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
    to_encode = data.copy()

    if isinstance(expires_delta, int):
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta)
    elif isinstance(expires_delta, datetime.timedelta):
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")) or 60)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))
    return encoded_jwt


def verify_token(token: str) -> Union[dict, None]:
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        return payload
    except JWTError:
        return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
