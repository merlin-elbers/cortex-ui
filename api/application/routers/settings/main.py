import json
from pathlib import Path
import requests
from fastapi import Depends, APIRouter
from application.modules.auth.dependencies import require_role
from application.modules.schemas.request_schemas import M365TokenRequest, Branding, MailServer, M365Settings, \
    SMTPSettings
from application.modules.schemas.response_schemas import (ValidationError, GeneralException, BaseResponse,
                                                          GeneralExceptionSchema, MicrosoftResponse, WhiteLabelResponse,
                                                          MailServerResponse)
from application.modules.database.database_models import WhiteLabelConfig, SMTPServer, Microsoft365, MatomoConfig


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
    tags=["🔍 System"],
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
            **white_label_config.__dict__
        )
    )


@router.put(
    "/white-label",
    status_code=201,
    name="WhiteLabel Konfiguration speichern",
    tags=["🔍 System"],
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
        _user = Depends(require_role('admin'))
):
    white_label_config = await WhiteLabelConfig.find_one()
    if not white_label_config:
        raise GeneralException(
            is_ok=False,
            status="CONFIG_NOT_FOUND",
            exception="WhiteLabelConfig wurde nicht gefunden",
            status_code=500
        )

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
        _user = require_role('admin')
):
    mail_settings = await Microsoft365.find_one() if await Microsoft365.find_one() else await SMTPServer.find_one()
    if not mail_settings:
        raise GeneralException(
            is_ok=False,
            status="CONFIG_NOT_FOUND",
            exception="SMTP Server / Microsoft 365 Konfiguration wurde nicht gefunden",
        )
    if type(mail_settings) == Microsoft365:
        mail_type = 'microsoft365'
        del mail_settings.clientSecret
        data = M365Settings(
            **mail_settings.__dict__
        )
    else:
        mail_type = 'smtp'
        del mail_settings.password
        data = SMTPSettings(
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

# endregion
