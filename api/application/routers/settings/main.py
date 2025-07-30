import json
import re
from pathlib import Path
import requests
import uuid6
from fastapi import Depends, APIRouter
from application.modules.auth.dependencies import require_role
from application.modules.schemas.request_schemas import M365TokenRequest, Branding, MailServer, M365Settings, \
    SMTPSettings, DatabaseConfig, Analytics
from application.modules.schemas.response_schemas import (ValidationError, GeneralException, BaseResponse,
                                                          GeneralExceptionSchema, MicrosoftResponse, WhiteLabelResponse,
                                                          MailServerResponse, DatabaseResponse, AnalyticsResponse)
from application.modules.database.database_models import WhiteLabelConfig, SMTPServer, Microsoft365, MatomoConfig
from application.modules.setup.setup_env import setup_env
from application.modules.utils.crypto import encrypt_password
from application.modules.utils.settings import get_settings

router = APIRouter()


# region M365

@router.post("/m365",
             status_code=200,
             name="Microsoft 365 Token speichern",
             tags=["🛠️ Einstellungen"],
             description="""
                Verarbeitet den Microsoft Authorization Code und tauscht ihn gegen ein Access + Refresh Token.
                Token wird gespeichert und ist bereit für weitere API-Nutzung mit O365 (z. B. Mailversand).
            """,
             response_description="Zugriffstoken gespeichert",
             responses={
                 200: {
                     'model': BaseResponse,
                     'description': 'Zugriffstoken gespeichert'
                 },
                 400: {
                     'model': GeneralExceptionSchema,
                     'description': 'Fehler beim Verarbeiten des Codes'
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
async def post_m365(data: M365TokenRequest):
    token_path = Path("tokens")
    token_path.mkdir(parents=True, exist_ok=True)
    token_file = token_path / "mail_token.json"

    token_url = f"https://login.microsoftonline.com/{data.tenantId}/oauth2/v2.0/token"

    try:
        res = requests.post(
            token_url,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "client_id": data.clientId,
                "scope": "offline_access User.Read Mail.Send",
                "code": data.code,
                "redirect_uri": data.redirect_uri,
                "grant_type": "authorization_code",
                "client_secret": data.clientSecret,
            }
        )

        if res.status_code != 200:
            raise GeneralException(
                is_ok=False,
                status="TOKEN_EXCHANGE_FAILED",
                exception=f"Tokenabruf fehlgeschlagen: {res.text}",
                status_code=500
            )

        token_data = res.json()

        access_token = token_data.get("access_token")
        user_info = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_json = user_info.json()

        with open(token_file, "w") as f:
            json.dump(token_data, f)

        return MicrosoftResponse(
            isOk=True,
            status="TOKEN_STORED",
            message="Token erfolgreich gespeichert",
            email=user_json.get("mail"),
            displayName=user_json.get("displayName")
        )

    except Exception as e:
        raise GeneralException(
            is_ok=False,
            status="TOKEN_SAVE_ERROR",
            exception=str(e),
            status_code=500
        )


# endregion

# region WhiteLabel

@router.get(
    "/white-label",
    status_code=200,
    name="WhiteLabel Konfiguration abrufen",
    tags=["🛠️ Einstellungen"],
    description="""
        Gibt die aktuell gespeicherte WhiteLabel-Konfiguration zurück. 
        Diese umfasst u.a. Logo-URL, App-Titel und weitere UI-bezogene Einstellungen.
    """,
    response_description="Aktuelle WhiteLabel-Konfiguration",
    responses={
        200: {
            "model": WhiteLabelResponse,
            "description": "WhiteLabel-Daten erfolgreich geladen"
        },
        404: {
            "model": GeneralExceptionSchema,
            "description": "Keine Konfiguration gefunden"
        },
        500: {
            "model": GeneralExceptionSchema,
            "description": "Interner Serverfehler bei der Datenabfrage"
        }
    }
)
async def get_white_label():
    white_label_config = await WhiteLabelConfig.find_one()
    settings = get_settings()
    if not white_label_config:
        raise GeneralException(
            is_ok=False,
            status="CONFIG_NOT_FOUND",
            exception=f"WhiteLabelConfig wurde nicht gefunden",
            status_code=500
        )
    return WhiteLabelResponse(
        isOk=True,
        status="OK",
        message=f"WhiteLabelConfig wurde gefunden",
        data=Branding(
            externalUrl=settings.EXTERNAL_URL,
            **white_label_config.__dict__
        )
    )


@router.put(
    "/white-label",
    status_code=201,
    name="WhiteLabel Konfiguration speichern",
    tags=["🛠️ Einstellungen"],
    description="""
        Speichert eine aktualisierte WhiteLabel-Konfiguration. 
        Diese Konfiguration wird systemweit verwendet, um das UI visuell anzupassen.
        Erfordert Adminrechte.
    """,
    response_description="Konfiguration gespeichert",
    responses={
        201: {
            "model": BaseResponse,
            "description": "WhiteLabel-Konfiguration erfolgreich gespeichert"
        },
        400: {
            "model": GeneralExceptionSchema,
            "description": "Ungültige Konfigurationsdaten übermittelt"
        },
        422: {
            "model": ValidationError,
            "description": "Validierungsfehler in der übermittelten Konfiguration"
        },
        500: {
            "model": GeneralExceptionSchema,
            "description": "Fehler beim Speichern der Konfiguration"
        }
    }
)
async def put_white_label(
        data: Branding,
        _user=Depends(require_role('admin'))
):
    white_label_config = await WhiteLabelConfig.find_one()
    if not white_label_config:
        raise GeneralException(
            is_ok=False,
            status="CONFIG_NOT_FOUND",
            exception="WhiteLabelConfig wurde nicht gefunden",
            status_code=500
        )

    setup_env(
        external_url=data.externalUrl,
    )

    del data.externalUrl

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(white_label_config, field, value)

    await white_label_config.save()

    return BaseResponse(
        isOk=True,
        status="OK",
        message="WhiteLabelConfig wurde aktualisiert",
    )


# endregion

# region E-Mail

@router.get(
    "/mail",
    status_code=200,
    tags=["🛠️ Einstellungen"],
    name="E-Mail-Einstellungen abrufen",
    description="""
        Gibt die aktuell konfigurierten Mail-Einstellungen zurück.

        Diese Route liefert alle SMTP- oder Microsoft 365-bezogenen Konfigurationsdaten,
        die für den Versand von System-E-Mails verwendet werden (z.B. Passwort-Zurücksetzen, Einladungen, etc.).

        ✅ Enthält:
        - Mail Provider: SMTP oder Microsoft 365
        - Absenderadresse (From)
        - SMTP-Host / Microsoft Tenant
        - Ports, Authentifizierungsinfos (maskiert)
        - Status: Ist der Mailserver erfolgreich getestet worden?

        ⚠️ Die sensiblen Felder wie `client_secret` oder `smtp_password` werden **nicht** mit ausgegeben.

        🔒 Authentifizierung erforderlich: Nur Admins dürfen die Konfiguration einsehen.
    """,
    response_description="Aktuell gespeicherte Mail-Konfiguration",
    responses={
        200: {
            "description": "Mail-Konfiguration erfolgreich geladen",
            "model": MailServerResponse
        },
        401: {
            "description": "Nicht autorisiert – Token fehlt oder ist ungültig",
            "model": GeneralExceptionSchema
        },
        403: {
            "description": "Zugriff verweigert – Adminrechte erforderlich",
            "model": GeneralExceptionSchema
        },
        500: {
            "description": "Mail-Konfiguration konnte nicht geladen werden",
            "model": GeneralExceptionSchema
        }
    }
)
async def get_mail(
        _user=Depends(require_role('admin'))
):
    mail_settings = await Microsoft365.find_one() if await Microsoft365.find_one() else await SMTPServer.find_one()
    if not mail_settings:
        raise GeneralException(
            is_ok=False,
            status="CONFIG_NOT_FOUND",
            status_code=400,
            exception="SMTP Server / Microsoft 365 Konfiguration wurde nicht gefunden",
        )
    if type(mail_settings) is Microsoft365:
        mail_type = 'microsoft365'
        del mail_settings.secretKey
        data = M365Settings(
            authenticated=True,
            **mail_settings.__dict__
        )
    else:
        mail_type = 'smtp'
        del mail_settings.password
        data = SMTPSettings(
            tested=True,
            **mail_settings.__dict__
        )
    return MailServerResponse(
        isOk=True,
        status="OK",
        message="Maileinstellungen gefunden",
        data=MailServer(
            type=mail_type,
            smtp=data if mail_type == 'smtp' else None,
            microsoft365=data if mail_type == 'microsoft365' else None,
        )
    )


@router.post(
    "/mail",
    status_code=201,
    tags=["🛠️ Einstellungen"],
    name="E-Mail-Einstellungen aktualisieren oder hinzufügen",
    description="""
        Aktualisiert die Mail-Konfiguration für das System oder fügt sie hinzu.

        Diese Route ermöglicht das Speichern oder Ändern der E-Mail-Versandeinstellungen
        – entweder für **SMTP** oder **Microsoft 365**. Je nach gewähltem Provider werden
        die entsprechenden Felder erwartet.

        ✅ Unterstützte Felder:
        - `type`: `"smtp"` oder `"microsoft365"`
        - SMTP: `host`, `port`, `username`, `password`, `senderEmail`, `senderName`
        - M365: `tenantId`, `clientId`, `secretKey`, `senderEmail`, `senderName`

        🔒 Sicherheits-Hinweis:
        - Nur Admins dürfen diese Konfiguration verändern.
        - Sensible Daten wie `smtp.password` oder `microsoft365.secretKey` werden
          sicher verarbeitet und nicht im Klartext gespeichert oder zurückgegeben.
    """,
    response_description="Konfiguration erfolgreich gespeichert (kein Inhalt)",
    responses={
        201: {
            "description": "Mail-Konfiguration erfolgreich gespeichert",
            "model": BaseResponse
        },
        400: {
            "description": "Ungültige Konfigurationsdaten – Validierung fehlgeschlagen",
            "model": GeneralExceptionSchema
        },
        401: {
            "description": "Nicht autorisiert – Token fehlt oder ist ungültig",
            "model": GeneralExceptionSchema
        },
        403: {
            "description": "Zugriff verweigert – Adminrechte erforderlich",
            "model": GeneralExceptionSchema
        },
        500: {
            "description": "Fehler beim Speichern der Konfiguration",
            "model": GeneralExceptionSchema
        }
    }
)
async def post_mail(
        data: MailServer,
        _=Depends(require_role('admin'))
):
    mail_settings = await Microsoft365.find_one()
    if not mail_settings:
        mail_settings = await SMTPServer.find_one()

    incoming_type = data.type
    incoming_data = data.microsoft365 if incoming_type == 'microsoft365' else data.smtp

    if mail_settings:
        current_type = 'microsoft365' if isinstance(mail_settings, Microsoft365) else 'smtp'

        if incoming_type != current_type:
            await mail_settings.delete()
        else:
            for field, value in incoming_data.model_dump(exclude_unset=True).items():
                if field in ('password', 'secretKey'):
                    value = encrypt_password(value)
                setattr(mail_settings, field, value)

            await mail_settings.save()

            return BaseResponse(
                isOk=True,
                status="OK",
                message="Maileinstellungen aktualisiert",
            )

    new_configuration = None

    if incoming_type == 'smtp':
        password = encrypt_password(incoming_data.password)
        del incoming_data.password

        new_configuration = SMTPServer(
            uid=str(uuid6.uuid7()),
            password=password,
            **incoming_data.__dict__
        )

    elif incoming_type == 'microsoft365':
        secret_key = encrypt_password(incoming_data.secretKey)
        del incoming_data.secretKey

        new_configuration = Microsoft365(
            uid=str(uuid6.uuid7()),
            secretKey=secret_key,
            **incoming_data.__dict__
        )

    if new_configuration:
        await new_configuration.create()
        return BaseResponse(
            isOk=True,
            status="CREATED",
            message="Maileinstellungen hinzugefügt",
        )

    raise GeneralException(
        is_ok=False,
        status_code=400,
        exception=f"Maileinstellungen konnten nicht gespeichert werden (Typ: {data.type})",
        status="BAD_REQUEST"
    )


# endregion

# region Database

@router.get(
    "/database",
    status_code=200,
    tags=["🛠️ Einstellungen"],
    name="Datenbank-Einstellungen abrufen",
    description="""
        Gibt die aktuell konfigurierte Datenbankverbindung zurück.

        Diese Route liefert Informationen zur Verbindung zur primären Datenbank,
        die vom System verwendet wird.

        ✅ Enthält:
        - Datenbank-URI (maskiert)
        - Name der Zieldatenbank
        - Status der letzten Verbindung (`connectionTested`)

        🔒 Authentifizierung erforderlich: Nur Admins dürfen die Konfiguration einsehen.
    """,
    response_description="Aktuell gespeicherte Datenbank-Konfiguration",
    responses={
        200: {
            "description": "Datenbank-Konfiguration erfolgreich geladen",
            "model": DatabaseResponse
        },
        401: {
            "description": "Nicht autorisiert – Token fehlt oder ist ungültig",
            "model": GeneralExceptionSchema,
        },
        403: {
            "description": "Zugriff verweigert – Adminrechte erforderlich",
            "model": GeneralExceptionSchema,
        },
        500: {
            "description": "Datenbank-Konfiguration konnte nicht geladen werden",
            "model": GeneralExceptionSchema,
        },
    },
)
async def get_database(
        _=Depends(require_role('admin'))
):
    settings = get_settings()
    return DatabaseResponse(
        isOk=True,
        status="OK",
        message="Datenbank-Einstellungen abgerufen",
        data=DatabaseConfig(
            uri=re.sub(r"://(.*?):(.*?)@", r"://\1:••••••@", settings.MONGODB_URI),
            dbName=settings.MONGODB_DB_NAME,
            connectionTested=True
        )
    )


@router.put(
    "/database",
    status_code=201,
    tags=["🛠️ Einstellungen"],
    name="Datenbank-Einstellungen aktualisieren",
    description="""
        Aktualisiert die Konfiguration für die Systemdatenbank.

        Diese Route wird verwendet, um die Verbindungsdaten für die primäre Datenbank
        zu hinterlegen oder zu aktualisieren.

        ✅ Unterstützte Felder:
        - `uri`: Komplette Verbindungs-URI zur Datenbank
        - `dbName`: Ziel-Datenbankname (z.B. `cortex`)
        - `connectionTested`: Ob die Verbindung bereits geprüft wurde

        🔒 Sicherheits-Hinweis:
        - Nur Admins dürfen diese Konfiguration speichern oder verändern.
        - Die URI wird bei Speicherung verschlüsselt oder maskiert gespeichert.
    """,
    response_description="Datenbank-Konfiguration erfolgreich gespeichert",
    responses={
        201: {
            "description": "Datenbank-Konfiguration gespeichert",
            "model": BaseResponse,
        },
        400: {
            "description": "Ungültige Konfigurationsdaten – Validierung fehlgeschlagen",
            "model": GeneralExceptionSchema,
        },
        401: {
            "description": "Nicht autorisiert – Token fehlt oder ist ungültig",
            "model": GeneralExceptionSchema,
        },
        403: {
            "description": "Zugriff verweigert – Adminrechte erforderlich",
            "model": GeneralExceptionSchema,
        },
        500: {
            "description": "Fehler beim Speichern der Konfiguration",
            "model": GeneralExceptionSchema,
        },
    },
)
async def post_database(
        data: DatabaseConfig,
        _=Depends(require_role('admin'))
):
    if not data.connectionTested:
        raise GeneralException(
            is_ok=False,
            status_code=400,
            exception="Datenbankverbindung wurde nicht getestet",
            status="BAD_REQUEST"
        )
    setup_env(
        mongodb_uri=data.uri,
        mongodb_db_name=data.dbName,
    )
    return BaseResponse(
        isOk=True,
        status="OK",
        message="Datenbank-Einstellungen aktualisiert",
    )


# endregion

# region Analytics

@router.get(
    "/analytics",
    status_code=200,
    tags=["🛠️ Einstellungen"],
    name="Analytics-Einstellungen abrufen",
    description="""
        Gibt die aktuell gespeicherte Analytics-Konfiguration zurück.

        Diese Route liefert Informationen zur Integration eines externen Tracking-Tools wie z. B. **Matomo**.

        ✅ Enthält:
        - URL der Tracking-Plattform
        - Authentifizierungsschlüssel oder Token (maskiert)
        - Site-ID oder Projektkennung
        - Status, ob die Verbindung erfolgreich getestet wurde (`connectionTested`)

        🔒 Authentifizierung erforderlich: Nur Admins dürfen die Konfiguration einsehen.
    """,
    response_description="Aktuell gespeicherte Analytics-Konfiguration",
    responses={
        200: {
            "description": "Analytics-Konfiguration erfolgreich geladen",
            "model": AnalyticsResponse
        },
        400: {
            "description": "Keine Analytics Konfiguration gefunden",
            "model": GeneralExceptionSchema,
        },
        401: {
            "description": "Nicht autorisiert – Token fehlt oder ist ungültig",
            "model": GeneralExceptionSchema,
        },
        500: {
            "description": "Analytics-Konfiguration konnte nicht geladen werden",
            "model": GeneralExceptionSchema,
        },
    },
)
async def get_analytics(
        _=Depends(require_role('admin'))
):
    analytics = await MatomoConfig.find_one()
    if not analytics:
        raise GeneralException(
            is_ok=False,
            status_code=400,
            exception="Keine Analytics Konfiguration gefunden",
            status="BAD_REQUEST"
        )
    del analytics.matomoApiKey
    return AnalyticsResponse(
        isOk=True,
        status="OK",
        message="Analytics Konfiguration gefunden",
        data=Analytics(
            matomoApiKey='',
            **analytics.__dict__
        )
    )


@router.post(
    "/analytics",
    status_code=201,
    tags=["🛠️ Einstellungen"],
    name="Analytics-Einstellungen speichern",
    description="""
        Aktualisiert oder speichert die Konfiguration für das Analytics-System.

        Diese Route erlaubt das Anlegen oder Anpassen der Matomo Analytics-Integration

        ✅ Unterstützte Felder:
        - `matomoUrl`: URL der Analytics-Plattform
        - `matomoApiKey`: Zugriffstoken oder Auth-Key
        - `siteId`: ID der zu trackenden Seite
        - `connectionTested`: Status der letzten Verbindung

        🔒 Sicherheits-Hinweis:
        - Nur Admins können diese Konfiguration verändern.
        - Sensible Felder wie `matomoApiKey` werden niemals im Klartext zurückgegeben oder gespeichert.
    """,
    response_description="Analytics-Konfiguration erfolgreich gespeichert",
    responses={
        201: {
            "description": "Konfiguration wurde gespeichert oder aktualisiert",
            "model": BaseResponse
        },
        400: {
            "description": "Ungültige Konfigurationsdaten – Validierung fehlgeschlagen",
            "model": GeneralExceptionSchema
        },
        401: {
            "description": "Nicht autorisiert – Token fehlt oder ist ungültig",
            "model": GeneralExceptionSchema
        },
        500: {
            "description": "Fehler beim Speichern der Analytics-Konfiguration",
            "model": GeneralExceptionSchema
        }
    }
)
async def post_analytics(
        data: Analytics,
        _=Depends(require_role('admin'))
):
    if not data.connectionTested:
        raise GeneralException(
            is_ok=False,
            status_code=400,
            exception="Matomoverbindung wurde nicht getestet",
            status="BAD_REQUEST"
        )
    del data.connectionTested

    analytics = await MatomoConfig.find_one()
    if analytics:
        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "matomoApiKey":
                value = encrypt_password(value)
            setattr(analytics, field, value)

        await analytics.save()
        return BaseResponse(
            isOk=True,
            status="OK",
            message="Konfiguration erfolgreich angepasst",
        )
    api_key = encrypt_password(data.matomoApiKey)
    del data.matomoApiKey

    new_configuration = MatomoConfig(
        uid=str(uuid6.uuid7()),
        matomoApiKey=api_key,
        **data.__dict__
    )
    await new_configuration.create()
    return BaseResponse(
        isOk=True,
        status="OK",
        message="Konfiguration erfolgreich erstellt",
    )

# endregion
