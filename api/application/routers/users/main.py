import datetime
from fastapi import APIRouter, Depends
from application.modules.database_models import User, GetUser, UserRole, Logins
from application.modules.schemas.response_schemas import ValidationError, UsersResponse
from application.routers.auth.utils import require_role

router = APIRouter()


@router.get("/users",
            status_code=200,
            summary="Alle Benutzer auflisten (Admin-only)",
            description="""
            Gibt eine Liste aller registrierten Benutzer zurück.  
            Diese Route ist nur für Admins zugänglich und dient der Übersicht, Verwaltung und Moderation von Nutzerkonten.

            🧾 Rückgabewerte:
            - Benutzer-UID
            - E-Mail-Adresse
            - Vor- und Nachname
            - Rolle (z.B. admin, editor, viewer)
            - Aktivitätsstatus (optional)
            - Letzte Anmeldung (optional)

            🔐 Hinweis:
            Diese Route ist geschützt und nur mit gültigem Admin-Token erreichbar.
            """,
            response_description="Liste aller Benutzerobjekte",
            tags=["👥 Benutzerverwaltung"],
            responses={
                200: {
                    'model': UsersResponse,
                    'description': 'Benutzer gefunden'
                },
                422: {
                    'model': ValidationError,
                    'description': 'Validierungsfehler in der Anfrage'
                },
                500: {
                    'model': ValidationError,
                    'description': 'Interner Serverfehler während der Verarbeitung der Daten'
                }
            })
async def get_users(_user=Depends(require_role(UserRole.admin))):

    users = await User.find_all().sort("-is_active").to_list()

    now = datetime.datetime.now()
    from_today = datetime.datetime(now.year, now.month, now.day)

    todays_logins = await Logins.find(Logins.createdAt >= from_today).count()
    admin_count = await User.find(User.role == "admin").count()
    active_users = await User.find(User.is_active.is_(True)).count()

    return UsersResponse(
        isOk=True,
        status="OK",
        message="Benutzer gefunden",
        data=[GetUser(accessToken=None, **u.model_dump(exclude={"password"})) for u in users],
        todaysLogins=todays_logins,
        administrators=admin_count,
        activeUsers=active_users
    )
