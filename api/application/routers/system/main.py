import datetime
import secrets
from pathlib import Path as FilePath
import uuid6
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from time import perf_counter
from fastapi import Path
from starlette import status
from starlette.responses import FileResponse, Response
from application.modules.auth.dependencies import require_role
from application.modules.backup.scheduler import start_backup_scheduler, run_mongo_backup, is_scheduler_running, \
    stop_backup_scheduler
from application.modules.schemas.request_schemas import BackupSettingsRequest
from application.modules.schemas.response_schemas import (ValidationError, GeneralException, DbHealthResponse,
                                                          BaseResponse, GeneralExceptionSchema, PingResponse,
                                                          StatusResponse, PublicKeysResponse, CreatePublicKeyResponse,
                                                          BackupStatusResponse, BackupListResponse)
from application.modules.database.database_models import UserRole, SMTPServer, Microsoft365, MatomoConfig, PublicKeys
from application.modules.schemas.schemas import ServerStatusSchema, DatabaseHealthSchema, PublicKeySchema, BackupFile
from application.modules.setup.setup_env import setup_env, BackupFrequency
from application.modules.utils.settings import get_settings

router = APIRouter()


# region System Health

@router.get("/status",
            status_code=200,
            tags=["🔍 System"],
            name="Systemstatus",
            description="""
                Prüft den aktuellen Zustand und die Konfiguration des CortexUI Systems.

                Es wird geprüft, ob folgende Systemkomponenten korrekt eingerichtet sind:

                ✅ Enthält:
                - Self-Signup: Ist die Nutzer-Selbstregistrierung aktiviert?
                - SMTP: Ist ein Mailserver oder Microsoft 365 erfolgreich konfiguriert?
                - Matomo: Ist ein Matomo API-Key vorhanden und funktionsfähig?
                - Datenbank: Ist die MongoDB-Verbindung aktiv?

                Diese Route wird im Dashboard verwendet,
                um die Integrität des Systems zu prüfen.

                🛡️ Kein Auth-Token erforderlich, da sie vor dem Login genutzt werden kann.
            """,
            response_description="Systemstatus in strukturierter Form",
            responses={
                200: {
                    'description': 'Alle Statusdaten erfolgreich geladen',
                    'model': StatusResponse
                },
                500: {
                    'description': 'Ein oder mehrere Komponenten sind nicht erreichbar / fehlerhaft konfiguriert',
                    'model': GeneralExceptionSchema
                }
            })
async def get_status():
    settings = get_settings()

    database_online = False
    uri = settings.MONGODB_URI
    if uri:
        client = AsyncIOMotorClient(uri)
        result = await client.admin.command("ping")

        if result.get("ok") == 1:
            database_online = True

    return StatusResponse(
        isOk=True,
        status="OK",
        message=f"Status überprüft",
        data=ServerStatusSchema(
            databaseOnline=database_online,
            selfSignupEnabled=settings.SELF_SIGNUP,
            smtpServerConfigured=True if await SMTPServer.find_one() else False,
            m365Configured=True if await Microsoft365.find_one() else False,
            matomoConfigured=True if await MatomoConfig.find_one() else False,
        )
    )



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
                data=DatabaseHealthSchema(
                    dbName=settings.MONGODB_DB_NAME,
                    serverVersion=server_status["version"],
                    uptimeSeconds=server_status["uptime"],
                    connectionCount=server_status["connections"]["current"],
                    latencyMs=round(duration, 2),
                    indexes=db_stats["indexes"],
                    storageSizeMB=round(db_stats["storageSize"] / 1024 / 1024, 2)
                )
            )
        raise Exception("Ping fehlgeschlagen")

    except Exception as e:
        raise GeneralException(
            exception=f"Fehler beim Verbindungsaufbau zur MongoDB. {str(e)}",
            status_code=500,
            status="DB_HEALTH_ERROR",
            is_ok=False
        )


# endregion

# region Backups

@router.get("/backup/status",
            status_code=200,
            name="Backup-Scheduler Status",
            tags=["🔍 System"],
            description="""
                Prüft, ob der automatische Backup-Scheduler aktiv ist und gibt die aktuell geplanten Backup-Jobs zurück.

                Nutzt den internen Status des APSchedulers, um Laufzeitinformationen bereitzustellen.

                ✅ Nützlich für:
                - Health-Checks
                - Monitoring im Admin-Dashboard

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            response_description="Status und aktive Jobs des Schedulers",
            responses={
                200: {
                    'description': 'Scheduler läuft (inkl. Jobliste)',
                    'model': BackupStatusResponse
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Fehler beim Abrufen des Scheduler-Status'
                }
            })
async def get_backup_status(
        _=Depends(require_role(UserRole.admin))
):
    return BackupStatusResponse(
        isOk=True,
        status="OK",
        message="Status erhalten",
        isRunning=is_scheduler_running()
    )


@router.get("/backup/list",
            status_code=200,
            name="Backups auflisten",
            tags=["🔍 System"],
            description="""
                Listet alle vorhandenen MongoDB-Backup-Dateien aus dem lokalen Backup-Verzeichnis (`/backups`) auf.

                Zusätzlich wird das Datum des zuletzt erstellten Backups mitgeliefert und der Backupzyklus.

                ✅ Nützlich für:
                - Admin-Einsicht in vergangene Sicherungen
                - UI-Anzeige zur Backup-Historie

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            response_description="Liste aller Backups mit Zeitstempel",
            responses={
                200: {
                    'description': 'Backup-Dateien erfolgreich geladen',
                    'model': BackupListResponse
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Fehler beim Lesen der Backup-Dateien'
                }
            })
async def list_backups(
        _=Depends(require_role("admin"))
):
    settings = get_settings()
    backup_dir = FilePath("backups")

    try:
        freq = BackupFrequency[settings.BACKUP_FREQUENCY].value
    except KeyError:
        freq = BackupFrequency.daily.value

    if not backup_dir.exists():
        return BackupListResponse(
            isOk=True,
            status="OK",
            message="Liste aller Backups mit Zeitstempel",
            lastBackup=None,
            data=[],
            frequency=freq,
            cleanUpDays=settings.BACKUP_CLEANUP
        )

    try:
        backups = []
        for file in sorted(backup_dir.glob("*.gz"), reverse=True):
            stat = file.stat()
            backups.append(BackupFile(
                fileName=file.name,
                createdAt=datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
            ))
        return BackupListResponse(
            isOk=True,
            status="OK",
            message="Liste aller Backups mit Zeitstempel",
            data=backups,
            lastBackup=backups[0].createdAt if backups else None,
            frequency=freq,
            cleanUpDays=settings.BACKUP_CLEANUP
        )

    except Exception as e:
        raise GeneralException(
            is_ok=False,
            status="INTERNAL_ERROR",
            exception=f"Fehler beim Lesen der Backupdaten: {e}",
            status_code=500
        )


@router.get("/backup/{file_name}",
            status_code=200,
            name="Backup herunterladen",
            tags=["🔍 System"],
            description="""
                Lädt die angegebene Backup-Datei aus dem lokalen Verzeichnis `/backups/` herunter.

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
async def get_backup_file(
        file_name: str = Path(..., description="Name von der Datei, die heruntergeladen werden soll"),
        _user=Depends(require_role("admin"))
):
    backup_dir = FilePath("backups")
    file_path = backup_dir / file_name

    if not file_path.exists() or not file_path.is_file():
        raise GeneralException(
            exception=f"Backup-Datei '{file_name}' nicht gefunden",
            status_code=404,
            status="BACKUP_NOT_FOUND",
            is_ok=False
        )

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/gzip"
    )


@router.put("/backup/settings",
            status_code=201,
            name="Backupeinstellungen ändern",
            tags=["🔍 System"],
            description="""
                Ändert den Backupzyklus des Schedulers und die Zeit, die ein Backup maximal alt sein darf.

                ✅ Nützlich für:
                - Änderung des Zyklus
                - Max Age für Backups
                - Integration in ein Admin-Dashboard

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            response_description="Backup-Datei erfolgreich bearbeitet",
            responses={
                201: {
                    'model': BaseResponse,
                    'description': 'Backup erfolgreich bearbeitet'
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
async def put_backup_frequency(
        data: BackupSettingsRequest,
        _=Depends(require_role("admin"))
):
    setup_env(
        backup_frequency=data.frequency,
        backup_cleanup=str(data.cleanUpDays) if data.cleanUpDays else "30"
    )
    return BaseResponse(
        isOk=True,
        status="OK",
        message="Backupeinstellungen erfolgreich geändert."
    )


@router.post("/backup/manually",
            status_code=201,
            name="Backup manuell starten",
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
                201: {
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
async def post_backup_manually():
    run_mongo_backup()

    return BaseResponse(
        isOk=True,
        status="OK",
        message=f"Backup manuell gestartet",
    )


@router.post("/backup/start",
            status_code=201,
            name="Backup starten",
            tags=["🔍 System"],
            description="""
                Startet den Backup Scheduler, welche im vorgegebenen Zyklus Backups von der Datenbank erstellt.

                Die Dumps werden im `.gz`-Format mithilfe von `mongodump` erzeugt. Die Route ist ausschließlich für Admins verfügbar.

                🔐 **Nur mit gültigem Admin-Token zugänglich**
            """,
            response_description="Backup-Datei erfolgreich erstellt",
            responses={
                201: {
                    'model': BaseResponse,
                    'description': 'Scheduler wurde erfolgreich gestartet'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Fehler beim Stoppen des Schedulers'
                }
            })
async def post_start_backup(
        _user=Depends(require_role("admin"))
):
    setup_env(
        backup_started="true"
    )
    start_backup_scheduler()

    return BaseResponse(
        isOk=True,
        status="OK",
        message=f"Backup Scheduler gestartet",
    )


@router.post("/backup/stop",
             status_code=201,
             name="Backup-Scheduler stoppen",
             tags=["🔍 System"],
             description="""
                Stoppt den aktuell laufenden Backup-Scheduler und entfernt alle geplanten Backup-Jobs.

                Dies deaktiviert die automatische Erstellung von Datenbank-Backups, bis der Scheduler manuell oder durch einen Neustart erneut gestartet wird.

                ✅ Nützlich für:
                - Temporäre Wartungsarbeiten
                - Notabschaltung bei fehlerhaften Jobs
                - UI-Kontrolle über den Backup-Zyklus

                🔐 **Nur mit gültigem Admin-Token zugänglich**
             """,
             response_description="Backup-Scheduler gestoppt",
             responses={
                 201: {
                     'model': BaseResponse,
                     'description': 'Scheduler wurde erfolgreich gestoppt'
                 },
                 500: {
                     'model': GeneralExceptionSchema,
                     'description': 'Fehler beim Stoppen des Schedulers'
                 }
             })
async def get_stop_backup(
        _=Depends(require_role("admin"))
):
    setup_env(
        backup_started="false"
    )
    stop_backup_scheduler()

    return BaseResponse(
        isOk=True,
        status="OK",
        message=f"Backup Scheduler gestoppt",
    )


@router.delete("/backup/{file_name}",
               status_code=204,
               name="Backup löschen",
               tags=["🔍 System"],
               description="""
                   Löscht eine angegebene Backup-Datei aus dem lokalen Backup-Verzeichnis (`/backups`).

                   ⚠️ Die Löschung ist **nicht umkehrbar** – stelle sicher, dass du das Backup nicht mehr benötigst.

                   ✅ Nützlich für:
                   - Aufräumen alter Backup-Dateien
                   - Backup-Rotation via Admin-Oberfläche

                   🔐 **Nur mit gültigem Admin-Token zugänglich**
               """,
               response_description="Backup-Datei wurde gelöscht",
               responses={
                   204: {
                       'description': 'Backup wurde erfolgreich gelöscht'
                   },
                   404: {
                       'model': GeneralExceptionSchema,
                       'description': 'Backup-Datei wurde nicht gefunden'
                   },
                   422: {
                       'model': ValidationError,
                       'description': 'Validierungsfehler in der Anfrage'
                   },
                   500: {
                       'model': GeneralExceptionSchema,
                       'description': 'Interner Fehler beim Löschen der Backup-Datei'
                   }
               })
async def delete_backup_file(
    file_name: str = Path(..., description="Name der zu löschenden Backup-Datei, z.B. cortexui-backup-2025-08-01-03-00.gz"),
    _user=Depends(require_role("admin"))
):
    backup_dir = FilePath("backups")
    file_path = backup_dir / file_name

    if not file_path.exists() or not file_path.is_file():
        raise GeneralException(
            exception=f"Backup-Datei '{file_name}' wurde nicht gefunden.",
            status_code=404,
            status="BACKUP_NOT_FOUND",
            is_ok=False
        )

    try:
        file_path.unlink()
        return Response(
            status_code=status.HTTP_204_NO_CONTENT
        )
    except Exception as e:
        raise GeneralException(
            exception=f"Fehler beim Löschen der Datei: {e}",
            status_code=500,
            status="DELETE_FAILED",
            is_ok=False
        )


# endregion

# region PublicKeys

@router.get("/public-keys",
            name="Alle Public API Keys auflisten",
            summary="Liste aller Public API Keys",
            description="""
                Gibt eine Übersicht aller aktiven und inaktiven Public API Keys im System zurück.

                ✅ Nützlich für:
                - Administration und Zugriffskontrolle
                - Übersicht über Integrationen
                - Auditing & Sicherheit

                🔐 **Erfordert gültigen Login-Token**
            """,
            response_description="Liste der vorhandenen API Keys",
            tags=["🔐 Public API Keys"],
            status_code=200,
            responses={
                200: {
                    'model': PublicKeysResponse,
                    'description': 'Erfolgreiche Rückgabe aller gespeicherten API Keys'
                },
                401: {
                    'model': GeneralExceptionSchema,
                    'description': 'Nicht autorisiert'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Interner Serverfehler beim Abruf der Daten'
                }
            })
async def get_public_keys(
        _=Depends(require_role("admin"))
):
    return PublicKeysResponse(
        isOk=True,
        status="OK",
        message=f"Public Keys gefunden",
        data=[PublicKeySchema(**public_key.__dict__) for public_key in await PublicKeys.find_all().to_list()]
    )


@router.post("/public-keys",
             name="Neuen Public API Key erstellen",
             summary="API Key erzeugen",
             description="""
                Erstellt einen neuen Public API Key mit allen relevanten Parametern.

                ✅ Nützlich für:
                - Drittanbieter-Integrationen (z.B. Matomo, CMS)
                - Zeitlich oder IP-beschränkte Zugänge
                - Sichere Machine-to-Machine Kommunikation

                🔐 **Erfordert gültigen Login-Token mit Admin-Rechten**
             """,
             response_description="Erstellter API Key (Vollansicht nur einmal sichtbar)",
             tags=["🔐 Public API Keys"],
             status_code=201,
             responses={
                 201: {
                     'model': CreatePublicKeyResponse,
                     'description': 'Neuer API Key wurde erfolgreich angelegt'
                 },
                 400: {
                     'model': GeneralExceptionSchema,
                     'description': 'Ungültige Eingabedaten'
                 },
                 401: {
                     'model': GeneralExceptionSchema,
                     'description': 'Nicht autorisiert'
                 },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Interner Serverfehler beim Speichern der Daten'
                }
             })
async def post_public_keys(
        data: PublicKeySchema,
        current_user=Depends(require_role("admin"))
):
    key = f"cortex-{secrets.token_urlsafe(24)}"
    new_public_key = PublicKeys(
        uid=str(uuid6.uuid7()),
        key=key,
        createdBy=current_user.uid,
        name=data.name,
        description=data.description,
        allowedIps=data.allowedIps,
        isActive=data.isActive,
    )
    await new_public_key.create()
    return CreatePublicKeyResponse(
        isOk=True,
        status="OK",
        message="Public Key erfolgreich erstellt",
        publicKey=PublicKeySchema(
            **new_public_key.__dict__
        )
    )


@router.put("/public-keys/{uid}",
            name="API Key aktualisieren",
            summary="Bestehenden API Key bearbeiten",
            description="""
                Aktualisiert die Metadaten, IP-Beschränkungen oder den Ablaufzeitpunkt eines bestehenden Public API Keys.

                ✅ Nützlich für:
                - Verlängerung/Aktualisierung von Integrationen
                - Ändern von IP-Listen
                - Anpassen von Beschreibungen oder Status

                🔐 **Erfordert gültigen Login-Token mit Admin-Rechten**
            """,
            response_description="Aktualisierter API Key",
            tags=["🔐 Public API Keys"],
            status_code=201,
            responses={
                201: {
                    'model': BaseResponse,
                    'description': 'API Key wurde erfolgreich aktualisiert'
                },
                404: {
                    'model': GeneralExceptionSchema,
                    'description': 'Kein API Key mit dieser UID gefunden'
                },
                401: {
                    'model': GeneralExceptionSchema,
                    'description': 'Nicht autorisiert'
                },
                500: {
                    'model': GeneralExceptionSchema,
                    'description': 'Interner Serverfehler beim Speichern der Daten'
                }
            })
async def put_public_keys(
        data: PublicKeySchema,
        uid: str = Path(..., description="UID des Public Keys, der bearbeitet werden soll"),
        _=Depends(require_role("admin"))
):
    public_key = await PublicKeys.find_one(PublicKeys.uid == uid)
    if not public_key:
        raise GeneralException(
            is_ok=False,
            status="NOT_FOUND",
            exception="Der Public Key mit der gegebenen UID wurde nicht gefunden",
            status_code=404
        )

    public_key.isActive = data.isActive
    await public_key.save()

    return BaseResponse(
        isOk=True,
        status="OK",
        message="Public Key erfolgreich bearbeitet",
    )


@router.delete("/public-keys/{uid}",
               name="Public API Key oder löschen",
               summary="API Key löschen",
               description="""
                   Entfernt einen bestehenden Public API Key anhand seiner UID.

                   ✅ Nützlich für:
                   - Sicherheitsmanagement bei Schlüsselkompromittierung
                   - Cleanup alter oder nicht mehr benötigter Keys
                   - Gültigkeit gezielt beenden

                   🔐 **Erfordert gültigen Login-Token mit Admin-Rechten**
               """,
               response_description="Bestätigung der Deaktivierung oder Löschung",
               tags=["🔐 Public API Keys"],
               status_code=204,
               responses={
                   204: {
                       'description': 'API Key wurde erfolgreich deaktiviert oder gelöscht'
                   },
                   404: {
                       'model': GeneralExceptionSchema,
                       'description': 'Kein API Key mit dieser UID gefunden'
                   },
                   401: {
                       'model': GeneralExceptionSchema,
                       'description': 'Nicht autorisiert'
                   },
                    500: {
                        'model': GeneralExceptionSchema,
                        'description': 'Interner Serverfehler beim Löschen des Public Keys'
                    }
               })
async def delete_public_keys(
        uid: str = Path(..., description="UID des Public Keys, der bearbeitet werden soll"),
        _=Depends(require_role("admin"))
):
    public_key = await PublicKeys.find_one(PublicKeys.uid == uid)
    if not public_key:
        raise GeneralException(
            is_ok=False,
            status="NOT_FOUND",
            exception="Der Public Key mit der gegebenen UID wurde nicht gefunden",
            status_code=404
        )
    if public_key.isActive:
        raise GeneralException(
            is_ok=False,
            status="STILL_ACTIVE",
            exception="Der Public Key mit der gegebenen UID ist noch aktiv, bitte erst deaktivieren.",
            status_code=400
        )
    await public_key.delete()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )

# endregion
