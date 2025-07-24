import datetime
import json
import subprocess
from pathlib import Path
import requests
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from time import perf_counter
import os
from starlette.responses import FileResponse
from application.modules.schemas.request_schemas import M365TokenRequest
from application.modules.schemas.response_schemas import ValidationError, GeneralException, DbHealthResponse, \
    BaseResponse, GeneralExceptionSchema, PingResponse, MicrosoftResponse, WhiteLabelResponse
from application.modules.database.database_models import UserRole, WhiteLabelConfig
from application.modules.utils.settings import get_settings
from application.routers.auth.utils import require_role

router = APIRouter()


@router.get('/ping',
            name="MongoDB Verbindung prüfen (ohne Authentifizierung)",
            description="""
                Führt einen schnellen Health-Check gegen die MongoDB-Datenbank aus und prüft, ob eine Verbindung erfolgreich aufgebaut werden kann.
            """,
            response_description="Verbindungsstatus zur MongoDB",
            tags=["🔍 System"],
            status_code=200,
            responses={
                200: {
                    'model': PingResponse,
                    'description': 'Verbindung erfolgreich hergestellt'
                },
                422: {
                    'model': ValidationError,
                    'description': 'Validierungsfehler in der Anfrage'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'MongoDB ist nicht erreichbar oder meldet einen Fehler'
                }
            })
async def ping():
    settings = get_settings()

    uri = settings.MONGODB_URI
    if not uri:
        raise GeneralException(
            exception="Keine MONGODB_URI in der .env gefunden",
            status_code=500,
            status="NO_URI",
            is_ok=False
        )

    client = AsyncIOMotorClient(uri)

    try:
        start = perf_counter()
        result = await client.admin.command("ping")
        duration = (perf_counter() - start) * 1000

        if result.get("ok") == 1:
            return PingResponse(
                isOk=True,
                status="OK",
                message="Verbindung OK",
                latencyMs=round(duration, 2)
            )
        raise Exception("Ping fehlgeschlagen")

    except Exception as e:
        raise GeneralException(
            exception=f"Fehler beim Verbindungsaufbau zur MongoDB. {str(e)}",
            status_code=500,
            status="DB_HEALTH_ERROR",
            is_ok=False
        )


@router.get("/database-health",
            name="MongoDB Verbindung prüfen",
            summary="MongoDB Health Check",
            description="""
                Führt einen schnellen Health-Check gegen die MongoDB-Datenbank aus und prüft, ob eine Verbindung erfolgreich aufgebaut werden kann.

                ✅ Nützlich für:
                - System-Monitoring und Statusanzeigen
                - Fehlerbehandlung im Frontend (z.B. Wartungsseiten)
                - DevOps & Deployment-Prozesse

                🔐 **Erfordert gültigen Login-Token**
            """,
            response_description="Verbindungsstatus zur MongoDB",
            tags=["🔍 System"],
            status_code=200,
            responses={
                200: {
                    'model': DbHealthResponse,
                    'description': 'Verbindung erfolgreich hergestellt'
                },
                422: {
                    'model': ValidationError,
                    'description': 'Validierungsfehler in der Anfrage'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'MongoDB ist nicht erreichbar oder meldet einen Fehler'
                }
            })
async def mongodb_health(
    _user=Depends(require_role(UserRole.admin))
):
    settings = get_settings()

    uri = settings.MONGODB_URI
    if not uri:
        raise GeneralException(
            exception="Keine MONGODB_URI in der .env gefunden",
            status_code=500,
            status="NO_URI",
            is_ok=False
        )

    client = AsyncIOMotorClient(uri)

    try:
        start = perf_counter()
        result = await client.admin.command("ping")
        duration = (perf_counter() - start) * 1000

        if result.get("ok") == 1:
            server_status = await client.admin.command("serverStatus")
            db_stats = await client.get_database(settings.MONGODB_DB_NAME).command("dbstats")

            return DbHealthResponse(
                isOk=True,
                status="DB_HEALTH_OK",
                message="Verbindungsstatus zur MongoDB OK",
                dbName=settings.MONGODB_DB_NAME,
                serverVersion=server_status["version"],
                uptimeSeconds=server_status["uptime"],
                connectionCount=server_status["connections"]["current"],
                latencyMs=round(duration, 2),
                indexes=db_stats["indexes"],
                storageSizeMB=round(db_stats["storageSize"] / 1024 / 1024, 2)
            )
        raise Exception("Ping fehlgeschlagen")

    except Exception as e:
        raise GeneralException(
            exception=f"Fehler beim Verbindungsaufbau zur MongoDB. {str(e)}",
            status_code=500,
            status="DB_HEALTH_ERROR",
            is_ok=False
        )


@router.get("/backup/start",
            status_code=200,
            name="Backup starten",
            tags=["🔍 System"],
            description="""
                Erstellt ein aktuelles Backup der MongoDB-Datenbank und speichert es im lokalen Backup-Verzeichnis (`/backups`).

                Der Dump wird im `.gz`-Format mithilfe von `mongodump` erzeugt. Die Route ist ausschließlich für Admins verfügbar.

                ✅ Nützlich für:
                - Manuelle Datensicherung via WebUI
                - Integration in ein Admin-Dashboard

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            response_description="Backup-Datei erfolgreich erstellt",
            responses={
                200: {
                    'model': BaseResponse,
                    'description': 'Backup erfolgreich erstellt (Dateiname enthalten)'
                },
                422: {
                    'model': ValidationError,
                    'description': 'Validierungsfehler in der Anfrage'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Fehler beim Backup-Prozess'
                }
            })
async def start_backup(
    _user=Depends(require_role("admin"))
):
    settings = get_settings()
    now = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M")
    filename = f"cortexui-backup-{now}.gz"
    backup_path = os.path.join(os.getcwd(), 'backups')

    if not backup_path:
        os.mkdir(backup_path)

    uri = settings.MONGODB_URI
    if not uri:
        raise GeneralException(
            exception="Keine MONGODB_URI in der .env gefunden",
            status_code=500,
            status="NO_URI",
            is_ok=False
        )

    try:
        subprocess.run([
            "mongodump",
            f"--uri={uri}",
            f"--db={settings.MONGODB_DB_NAME}",
            f"--archive={os.path.join(backup_path, filename)}",
            "--gzip"
        ], check=True)

        return BaseResponse(
            isOk=True,
            status="OK",
            message=f"Backup erstellt",
        )

    except subprocess.CalledProcessError as e:
        raise GeneralException(
            is_ok=False,
            exception=f"Backup fehlgeschlagen: {e}",
            status_code=500,
            status="BACKUP_ERROR",
        )


@router.get("/backup/latest",
            status_code=200,
            name="Letztes Backup herunterladen",
            tags=["🔍 System"],
            description="""
                Lädt die zuletzt erstellte Backup-Datei aus dem lokalen Verzeichnis `/backups/` herunter.

                ✅ Nützlich für:
                - Manuelles Wiederherstellen von Daten
                - Anzeige des letzten Backups im UI

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            response_description="Neueste Backup-Datei als GZIP-Archiv",
            responses={
                200: {
                    'description': 'Backup-Datei wird als Download zurückgegeben'
                },
                404: {
                    'model': GeneralExceptionSchema,
                    'description': 'Keine Backup-Datei gefunden'
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
async def get_latest_backup(
    _user=Depends(require_role("admin"))
):
    backup_path = Path(os.path.join(os.getcwd(), 'backups'))
    backups = sorted(backup_path.glob("*.gz"), reverse=True)
    if not backups:
        raise GeneralException(
            exception="Keine Backups im Verzeichnis gefunden",
            status_code=404,
            status="NO_BACKUPS_FOUND",
            is_ok=False
        )

    return FileResponse(
        backups[0],
        filename=backups[0].name,
        media_type="application/gzip"
    )


@router.post("/token",
            status_code=200,
            name="Microsoft 365 Token speichern",
            tags=["🔍 System"],
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
async def receive_m365_token(data: M365TokenRequest):
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


@router.get("/white-label",
            status_code=200,
            name="Microsoft 365 Token speichern",
            tags=["🔍 System"],
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
        logo=white_label_config.logo,
        title=white_label_config.title,
    )
