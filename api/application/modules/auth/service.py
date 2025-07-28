from typing import Union
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from application.modules.auth.security import pwd_context
from application.modules.utils.settings import get_settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_token(token: str) -> Union[dict, None]:
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
