from typing import Union, List
from fastapi import Depends
from jose import jwt, JWTError
from starlette import status
from application.modules.auth.service import oauth2_scheme
from application.modules.database.database_models import User, UserRole
from application.modules.schemas.response_schemas import GeneralException
from application.modules.utils.settings import get_settings


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
