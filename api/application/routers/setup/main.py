import datetime
import uuid6
from fastapi import APIRouter
from application import init_db
from application.modules.auth.security import hash_password
from application.modules.database.connection import logger
from application.modules.database.database_models import Microsoft365, SMTPServer, User, MatomoConfig, WhiteLabelConfig
from application.modules.schemas.request_schemas import SetupData
from application.modules.schemas.response_schemas import SetupResponse, GeneralExceptionSchema, BaseResponse, \
    ValidationError, GeneralException
from application.modules.setup.setup_env import setup_env
from application.modules.utils.crypto import encrypt_password
from application.modules.utils.settings import get_settings

router = APIRouter()


@router.get("/status",
            status_code=200,
            name="Setup Status abfragen",
            tags=["⚙️ Setup"],
            description="""
                Prüft, ob das Initial-Setup von Cortex UI bereits abgeschlossen wurde.

                ✅ Nützlich für:
                - UI-Redirects bei erstmaligem Start
                - Deaktivieren von Setup-Routen im Betrieb

                ℹ️ Der Status wird über die Umgebungsvariable `SETUP_COMPLETED` geprüft.
            """,
            response_description="Setup-Status von Cortex UI",
            responses={
                200: {
                    'model': SetupResponse,
                    'description': 'Setup-Status erfolgreich abgefragt'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Interner Serverfehler beim Abfragen des Status'
                }
            })
async def check_setup():
    settings = get_settings()
    return SetupResponse(
        isOk=True,
        status="OK",
        message="Setup vollständig" if settings.SETUP_COMPLETED else "Setup unvollständig",
        setupCompleted=settings.SETUP_COMPLETED
    )


@router.post("/complete",
             status_code=200,
             name="Setup abschließen",
             tags=["⚙️ Setup"],
             description="""
                 Markiert das Initial-Setup von Cortex UI als abgeschlossen.

                 ✅ Nützlich für:
                 - Beenden des Setup-Modus
                 - Aktivieren des regulären Logins und Routings

                 ⚠️ Diese Route sollte **nur einmal** nach erfolgreichem Setup-Prozess aufgerufen werden.

                 🔒 Idealerweise geschützt oder nur im Setup-Modus verfügbar.
             """,
             response_description="Setup erfolgreich abgeschlossen",
             responses={
                 200: {
                     'model': BaseResponse,
                     'description': 'Setup wurde abgeschlossen'
                 },
                 400: {
                     'model': GeneralExceptionSchema,
                     'description': 'Setup konnte nicht abgeschlossen werden'
                 },
                 422: {
                     'model': ValidationError,
                     'description': 'Validierungsfehler in der Anfrage'
                 },
                 500: {
                     'model': GeneralExceptionSchema,
                     'description': 'Interner Serverfehler beim Abschließen des Setups'
                 }
             })
async def complete_setup(data: SetupData):
    settings = get_settings()

    if settings.SETUP_COMPLETED:
        raise GeneralException(
            is_ok=False,
            status="ALREADY_SETUP",
            exception="Das Setup wurde bereits abgeschlossen.",
            status_code=400
        )

    if not data.license.accepted:
        raise GeneralException(
            is_ok=False,
            status="FORBIDDEN",
            exception=f"Lizenz wurde nicht akzeptiert",
            status_code=403
        )
    try:
        setup_env(
            mongodb_uri=data.database.uri,
            mongodb_db_name=data.database.dbName,
        )

        await init_db()

        existing_admin = await User.find_one(User.role == "admin")

        if existing_admin:
            raise GeneralException(
                is_ok=False,
                status="ADMIN_EXISTS",
                exception="Ein Admin-Benutzer existiert bereits.",
                status_code=409
            )

        admin_user = User(
            uid=str(uuid6.uuid7()),
            email=data.adminUser.email,
            password=hash_password(data.adminUser.password),
            firstName=data.adminUser.firstName,
            lastName=data.adminUser.lastName,
            isActive=True,
            role='admin',
            lastSeen=datetime.datetime.now()
        )

        await admin_user.create()

        await WhiteLabelConfig.find_all().delete()

        new_white_label_config = WhiteLabelConfig(
            uid=str(uuid6.uuid7()),
            **data.branding.__dict__
        )

        await new_white_label_config.create()

        if data.mailServer.type == 'microsoft365' and data.mailServer.microsoft365 is not None and data.mailServer.microsoft365.authenticated:
            await Microsoft365.find_all().delete()

            new_configuration = Microsoft365(
                uid=str(uuid6.uuid7()),
                **data.mailServer.microsoft365.__dict__
            )

            await new_configuration.create()

        elif data.mailServer.type == 'smtp' and data.mailServer.smtp and data.mailServer.smtp.tested:
            await SMTPServer.find_all().delete()

            encrypted_password = encrypt_password(data.mailServer.smtp.password)
            del data.mailServer.smtp.password

            new_configuration = SMTPServer(
                uid=str(uuid6.uuid7()),
                password=encrypted_password,
                **data.mailServer.smtp.__dict__
            )

            await new_configuration.create()

        if data.analytics.connectionTested:
            await MatomoConfig.find_all().delete()

            encrypted_password = encrypt_password(data.analytics.matomoApiKey)
            del data.analytics.matomoApiKey

            new_configuration = MatomoConfig(
                uid=str(uuid6.uuid7()),
                matomoApiKey=encrypted_password,
                **data.analytics.__dict__
            )

            await new_configuration.create()

        logger.info(f"✅ Setup abgeschlossen von {data.adminUser.email} @ {datetime.datetime.now()}")

        setup_env(
            self_signup=str(data.selfSignup.enabled).lower(),
            setup_completed="true"
        )

        return BaseResponse(
            isOk=True,
            status="DONE",
            message="Setup erfolgreich abgeschlossen"
        )
    except Exception as e:
        raise GeneralException(
            is_ok=False,
            status="ERROR",
            exception=f"Fehler beim Abschließen des Setups: {str(e)}",
            status_code=500
        )
