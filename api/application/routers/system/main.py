import datetime
import subprocess
from pathlib import Path
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from time import perf_counter
import os
from starlette.responses import FileResponse
from application.modules.schemas.response_schemas import ValidationError, GeneralException, DbHealthResponse, \
    BaseResponse, GeneralExceptionSchema, PingResponse
from application.modules.utils.database_models import UserRole
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
    uri = os.getenv("MONGODB_URI")
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
    uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("MONGODB_DB_NAME")
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
            db_stats = await client.get_database(database_name).command("dbstats")

            return DbHealthResponse(
                isOk=True,
                status="DB_HEALTH_OK",
                message="Verbindungsstatus zur MongoDB OK",
                dbName=database_name,
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
    now = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M")
    filename = f"cortexui-backup-{now}.gz"
    backup_path = os.path.join(os.getcwd(), 'backups')

    if not backup_path:
        os.mkdir(backup_path)

    uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("MONGODB_DB_NAME")
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
            f"--db={database_name}",
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
