import datetime
from fastapi import APIRouter, Depends, Path
from starlette import status
from starlette.responses import Response
from uuid6 import uuid7

from application.modules.auth.dependencies import require_role
from application.modules.auth.security import hash_password
from application.modules.database.database_models import User, UserRole, Logins
from application.modules.schemas.response_schemas import ValidationError, UsersResponse, BaseResponse, GeneralException, \
    GeneralExceptionSchema
from application.modules.schemas.schemas import UpdateUser, GetUser, CreateUserAdmin

router = APIRouter()


@router.get("/users",
            status_code=status.HTTP_200_OK,
            summary="Alle Benutzer auflisten",
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
                    'model': GeneralExceptionSchema,
                    'description': 'Interner Serverfehler während der Verarbeitung der Daten'
                }
            })
async def get_users(
        _user=Depends(require_role(UserRole.admin))
):
    users = await User.find_all().sort("-is_active").to_list()

    now = datetime.datetime.now()
    from_today = datetime.datetime(now.year, now.month, now.day)

    todays_logins = await Logins.find(Logins.timestamp >= from_today).count()
    admin_count = await User.find(User.role == "admin").count()
    active_users = await User.find(User.isActive == True).count()

    return UsersResponse(
        isOk=True,
        status="OK",
        message="Benutzer gefunden",
        data=[GetUser(
            accessToken=None,
            **user.model_dump(exclude={"password"})
        ) for user in users],
        todaysLogins=todays_logins,
        administrators=admin_count,
        activeUsers=active_users
    )


@router.post("/users",
             name="Neuen Benutzer anlegen",
             summary="Neuen Benutzer erstellen",
             description="""
                Erstellt einen neuen Benutzer im System.  
                Diese Route ist ausschließlich für Administratoren zugänglich und ermöglicht das manuelle Anlegen neuer Benutzer über das Admin-Interface.

                ✅ Nützlich für:
                - Benutzerverwaltung im Admin-Panel
                - Rollenbasierte Einrichtung von Teammitgliedern
                - Initiales Setup neuer Accounts

                🔐 **Nur mit gültigem Admin-Token zugänglich**
             """,
             status_code=status.HTTP_201_CREATED,
             response_description="Benutzer erfolgreich erstellt",
             tags=["👥 Benutzerverwaltung"],
             responses={
                 201: {
                     'model': BaseResponse,
                     'description': 'Benutzer erfolgreich erstellt'
                 },
                 400: {
                     'model': GeneralExceptionSchema,
                     'description': 'Fehlerhafte Eingabedaten'
                 },
                 422: {
                     'model': ValidationError,
                     'description': 'Validierungsfehler in der Anfrage'
                 },
                 401: {
                     'model': GeneralExceptionSchema,
                     'description': 'Nicht autorisiert'
                 },
                 500: {
                     'model': GeneralExceptionSchema,
                     'description': 'Interner Serverfehler'
                 }
             })
async def post_users(
        data: CreateUserAdmin,
        _user=Depends(require_role("admin"))
):
    try:
        uid = uuid7().__str__()
        while await User.find_one({User.uid: uid}):
            uid = uuid7().__str__()

        new_user = User(
            uid=uid,
            email=data.email,
            password=hash_password(data.password),
            firstName=data.firstName,
            lastName=data.lastName,
            isActive=data.isActive,
            role=data.role,
            lastSeen=None
        )
        await new_user.create()

        return BaseResponse(
            isOk=True,
            status="OK",
            message="Benutzer erfolgreich erstellt"
        )

    except Exception as e:
        raise GeneralException(
            is_ok=False,
            status="FAILED",
            exception=f"Fehler beim Erstellen des Benutzers: {e}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/users/{uid}",
            name="Benutzer aktualisieren",
            summary="Bestehenden Benutzer ändern",
            description="""
                Aktualisiert die Informationen eines bestehenden Benutzers anhand seiner UID.  
                Diese Route ist ausschließlich für Administratoren verfügbar.

                🔁 Mögliche Änderungen:
                - Vor- und Nachname
                - Aktivitätsstatus
                - Rolle
                - Passwort (optional)

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            status_code=status.HTTP_200_OK,
            response_description="Benutzer erfolgreich aktualisiert",
            tags=["👥 Benutzerverwaltung"],
            responses={
                200: {
                    'model': BaseResponse,
                    'description': 'Benutzer erfolgreich aktualisiert'
                },
                400: {
                    'model': GeneralExceptionSchema,
                    'description': 'Fehlerhafte Eingabedaten'
                },
                401: {
                    'model': GeneralExceptionSchema,
                    'description': 'Nicht autorisiert'
                },
                404: {
                    'model': GeneralExceptionSchema,
                    'description': 'Benutzer nicht gefunden'
                },
                422: {
                    'model': ValidationError,
                    'description': 'Validierungsfehler in der Anfrage'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Interner Serverfehler'
                }
            })
async def update_user(
        data: UpdateUser,
        uid: str = Path(..., description="UID des zu aktualisierenden Benutzers"),
        _user=Depends(require_role("admin"))
):
    user = await User.find_one(User.uid == uid)
    if not user:
        raise GeneralException(
            is_ok=False,
            status="NOT_FOUND",
            exception="Benutzer nicht gefunden",
            status_code=status.HTTP_404_NOT_FOUND
        )

    if data.firstName:
        user.firstName = data.firstName
    if data.lastName:
        user.lastName = data.lastName
    if data.role:
        user.role = data.role
    if data.isActive is not None:
        user.isActive = data.isActive
    if data.password:
        user.password = hash_password(data.password)

    await user.create()

    return BaseResponse(
        isOk=True,
        status="OK",
        message="Benutzer erfolgreich aktualisiert"
    )


@router.delete("/users/{uid}",
               name="Benutzer löschen",
               summary="Benutzerkonto entfernen (Admin-only)",
               description="""
                   Löscht einen Benutzer anhand seiner UID aus der Datenbank.  
                   Diese Route ist ausschließlich für Administratoren zugänglich.

                   ❗ Achtung:
                   - Die Aktion ist irreversibel.
                   - Es erfolgt keine Soft-Delete-Markierung – der Datensatz wird entfernt.

                   🔐 **Nur mit gültigem Admin-Token zugänglich**
               """,
               status_code=status.HTTP_204_NO_CONTENT,
               response_description="Benutzer gelöscht",
               tags=["👥 Benutzerverwaltung"],
               responses={
                   204: {
                       'description': 'Benutzer erfolgreich gelöscht'
                   },
                   401: {
                       'model': GeneralExceptionSchema,
                       'description': 'Nicht autorisiert'
                   },
                   404: {
                       'model': GeneralExceptionSchema,
                       'description': 'Benutzer nicht gefunden'
                   },
                   422: {
                       'model': ValidationError,
                       'description': 'Validierungsfehler in der Anfrage'
                   },
                   500: {
                       'model': GeneralExceptionSchema,
                       'description': 'Interner Fehler beim Löschen'
                   }
               })
async def delete_user(
        uid: str = Path(..., description="UID des Benutzers, der gelöscht werden soll"),
        _user=Depends(require_role("admin"))
):
    user = await User.find_one(User.uid == uid)
    if not user:
        raise GeneralException(
            is_ok=False,
            status="NOT_FOUND",
            exception="Benutzer nicht gefunden",
            status_code=status.HTTP_404_NOT_FOUND
        )

    await user.delete_all()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
