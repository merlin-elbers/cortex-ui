import datetime
import secrets

from starlette.requests import Request
from uuid6 import uuid7
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from starlette import status
from application.modules.auth.dependencies import get_current_user
from application.modules.auth.login_logger import log_login_attempt
from application.modules.auth.security import create_access_token, hash_password
from application.modules.auth.service import verify_password
from application.modules.database.database_models import User, LoginStatus, EmailVerification, Microsoft365, SMTPServer, \
    WhiteLabelConfig
from application.modules.mail.mailer import send_html_email
from application.modules.schemas.request_schemas import VerifyRequest
from application.modules.schemas.response_schemas import AuthResponse, ValidationError, GeneralException, BaseResponse, \
    GeneralExceptionSchema
from application.modules.schemas.schemas import GetUser, CreateUserSelf
from application.modules.utils.settings import get_settings

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
    if not user or (user and not verify_password(form_data.password, user.password)):
        if user and not verify_password(form_data.password, user.password):
            await log_login_attempt(request, user.uid, LoginStatus.failed)
        raise GeneralException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            status="UNAUTHORIZED",
            exception="Benutzer nicht gefunden oder das Passwort ist falsch",
            is_ok=False
        )
    if user and not user.isActive:
        if user and not verify_password(form_data.password, user.password):
            await log_login_attempt(request, user.uid, LoginStatus.failed)
        raise GeneralException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            status="UNAUTHORIZED",
            exception="Benutzer ist nicht aktiv, bitte prüfen Sie ihr E-Mail Postfach",
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
    settings = get_settings()

    if not settings.SELF_SIGNUP:
        raise GeneralException(
            status_code=status.HTTP_403_FORBIDDEN,
            status="FORBIDDEN",
            exception="Die öffentliche Registrierung ist deaktiviert, bitte kontaktieren Sie einen Administrator.",
            is_ok=False
        )

    user = await User.find_one(User.email == new_user.email)
    if user:
        raise GeneralException(
            status_code=status.HTTP_400_BAD_REQUEST,
            status="BAD REQUEST",
            exception="Ein Benutzer mit dieser E-Mail existiert bereits.",
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

    if settings.EMAIL_VERIFICATION:
        mail_settings = await Microsoft365.find_one() if await Microsoft365.find_one() else await SMTPServer.find_one()
        white_label_config = await WhiteLabelConfig.find_one()
        verification_code = secrets.token_urlsafe(32)

        new_verification = EmailVerification(
            email=new_user.email,
            token=verification_code,
            userUid=uid
        )

        await new_verification.create()

        await send_html_email(
            to_email=new_user.email,
            subject=f"{white_label_config.title if white_label_config else "CortexUI"} | E-Mail Verifizierung",
            template_name="mail_verification.html",
            context={
                "firstName": new_user.firstName,
                "lastName": new_user.lastName,
                "company": white_label_config.title if white_label_config else "CortexUI",
                "code": verification_code,
                "link": f"{settings.EXTERNAL_URL}/verify?code={verification_code}"
            },
            mode="smtp" if type(mail_settings) is SMTPServer else "microsoft365"
        )

    return BaseResponse(
        isOk=True,
        status="OK",
        message="Benutzer erfolgreich erstellt"
    )


@router.post(
    "/verify",
    status_code=200,
    tags=["🔐 Authentifizierung"],
    name="E-Mail-Adresse verifizieren",
    description="""
    Verifiziert eine E-Mail-Adresse anhand eines gültigen Verifizierungscodes,  
    der zuvor per E-Mail an den Benutzer gesendet wurde.  

    Der Code wird mit der Datenbank abgeglichen, überprüft auf Gültigkeit und Ablaufzeit  
    und markiert das zugehörige Konto bei Erfolg als verifiziert.

    💡 Hinweise:
    - Der Code ist **eine Stunde lang gültig**
    - Der Code kann entweder über einen Verifizierungs-Link oder manuell übergeben werden
    - Bei Erfolg wird eine Bestätigung im JSON-Format zurückgegeben

    🔒 Nach erfolgreicher Verifizierung kann sich der Benutzer einloggen.
    """,
    response_description="Verifizierung erfolgreich oder fehlgeschlagen",
    responses={
        200: {
            'model': BaseResponse,
            'description': 'E-Mail erfolgreich verifiziert'
        },
        400: {
            'model': GeneralExceptionSchema,
            'description': 'Verifizierungscode ungültig oder abgelaufen'
        },
        422: {
            'model': ValidationError,
            'description': 'Validierungsfehler in der Anfrage'
        },
        500: {
            'model': GeneralExceptionSchema,
            'description': 'Interner Serverfehler während der Verifizierung'
        }
    }
)
async def post_verify(
        data: VerifyRequest
):
    token = await EmailVerification.find_one(EmailVerification.token == data.code)
    if not token or token.is_expired():
        raise GeneralException(
            is_ok=False,
            exception="Code wurde nicht gefunden oder ist nicht mehr gültig",
            status="TOKEN_ERROR",
            status_code=400
        )

    user = await User.find_one(User.uid == token.userUid)
    if not user:
        raise GeneralException(
            is_ok=False,
            exception="Der Benutzer zu diesem Code wurde nicht gefunden",
            status="USER_ERROR",
            status_code=400
        )

    user.isActive = True
    await user.save()

    token.isVerified = True
    await token.save()

    return BaseResponse(
        isOk=True,
        status="OK",
        message="E-Mail erfolgreich verifiziert"
    )
