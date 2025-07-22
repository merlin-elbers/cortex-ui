import datetime
import os
from starlette.requests import Request
from uuid6 import uuid7
from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from starlette import status
from application.modules.utils.database_models import User, LoginStatus
from application.modules.schemas.response_schemas import AuthResponse, ValidationError, GeneralException, BaseResponse, \
    GeneralExceptionSchema
from application.modules.utils.schemas import GetUser, CreateUserSelf
from application.routers.auth.utils import verify_password, create_access_token, get_current_user, hash_password, \
    log_login_attempt

router = APIRouter()


@router.get("/me",
            status_code=200,
            tags=["🔐 Authentifizierung"],
            name="Erhalte eingeloggten Benutzer",
            description="""
                Gibt die Informationen zum aktuell authentifizierten Benutzer zurück.
                
                Die Authentifizierung erfolgt über einen gültigen JWT im `Authorization` Header:
                Authorization: Bearer <ACCESS_TOKEN>.
                
                ✅ Nützlich für:
                - Anzeige des eingeloggten Users im Frontend
                - Rollenprüfung (Admin, Editor, etc.)
                - Benutzerprofil und Dashboards
                
                🔐 **Erfordert gültigen Login-Token**
            """,
            response_description="Der eingeloggte Benutzer (ohne Passwort)",
            responses={
                200: {
                    'model': AuthResponse,
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
async def get_me(
    user=Depends(get_current_user)
):
    return AuthResponse(
        isOk=True,
        status="OK",
        message="Benutzer gefunden",
        data=GetUser(
            accessToken=None,
            **user.__dict__
        ),
    )


@router.post("/login",
             status_code=200,
             tags=["🔐 Authentifizierung"],
             name="Benutzer einloggen & Token erhalten",
             description="""
             Authentifiziert einen registrierten Benutzer und gibt ein gültiges JWT-Access-Token zurück.  
             
             Das Token kann anschließend im `Authorization` Header als Bearer-Token verwendet werden:
             Authorization: Bearer <ACCESS_TOKEN>

             💡 Hinweise:
             - Der Login erfolgt mit E-Mail und Passwort
             - Bei Erfolg wird ein `access_token` im JSON-Format zurückgegeben
             - Das Token ist standardmäßig 60 Minuten gültig

             🔐 Dieses Token wird für geschützte Routen benötigt (z.B. `/auth/me`, `/users`, etc.)
             """,
             response_description="JWT-Access-Token im JSON-Format",
             responses={
                 200: {
                     'model': AuthResponse,
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
async def post_login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await User.find_one(User.email == form_data.username)
    if not user or (user and not verify_password(form_data.password, user.password)) or (user and not user.isActive):
        if user and not verify_password(form_data.password, user.password):
            await log_login_attempt(request, user.uid, LoginStatus.failed)
        raise GeneralException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            status="UNAUTHORIZED",
            exception="User not found, inactive or incorrect password",
            is_ok=False
        )
    await log_login_attempt(request, user.uid, LoginStatus.success)
    return AuthResponse(
        isOk=True,
        status="OK",
        message="Benutzer gefunden",
        data=GetUser(
            accessToken=create_access_token({"uid": user.uid}),
            **user.__dict__,
        )
    )


@router.post("/sign-up",
             status_code=201,
             tags=["🔐 Authentifizierung"],
             name="Neuen Benutzer registrieren",
             description="""
             Erstellt einen neuen Benutzer-Account mit den angegebenen Zugangsdaten.  
             Das Passwort wird sicher mit `bcrypt` gehasht und gespeichert.

             💡 Hinweise:
             - Die Administratoren können den Self-Signup verboten haben
             - Die E-Mail muss eindeutig sein
             - Das Passwort wird nicht im Klartext gespeichert
             - Die Rolle wird standardmäßig auf 'viewer' gesetzt

             📥 Erwartet:
             - `email` (str)
             - `password` (str)
             - `first_name` (str, optional)
             - `last_name` (str, optional)

             ✅ Nach erfolgreicher Registrierung kann sich der Benutzer direkt über `/auth/login` einloggen.
             """,
             response_description="Registrierter Benutzer (ohne Passwort)",
             responses={
                 200: {
                     'model': BaseResponse,
                     'description': 'Benutzer erstellt'
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
async def post_signup(
    new_user: CreateUserSelf
):
    load_dotenv()

    if os.getenv('SELF_SIGNUP') == 'false':
        raise GeneralException(
            status_code=status.HTTP_403_FORBIDDEN,
            status="FORBIDDEN",
            exception="Self signup is disabled, please contact an administrator.",
            is_ok=False
        )

    user = await User.find_one(User.email == new_user.email)
    if user:
        raise GeneralException(
            status_code=status.HTTP_400_BAD_REQUEST,
            status="BAD REQUEST",
            exception="User with given email already exists",
            is_ok=False
        )

    uid = uuid7().__str__()
    while await User.find_one({User.uid: uid}):
        uid = uuid7().__str__()

    new_user = User(
        uid=uid,
        email=new_user.email,
        password=hash_password(new_user.password),
        firstName=new_user.firstName,
        lastName=new_user.lastName,
        isActive=False,
        role='viewer',
        lastSeen=datetime.datetime.now()
    )
    await new_user.create()

    return BaseResponse(
        isOk=True,
        status="OK",
        message="Benutzer erfolgreich erstellt"
    )
