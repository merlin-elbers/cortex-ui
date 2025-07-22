from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from time import perf_counter
import os
from application.modules.schemas.response_schemas import ValidationError, GeneralException, DbHealthResponse
from application.modules.utils.database_models import UserRole
from application.routers.auth.utils import require_role

router = APIRouter()

@router.get("/database",
            name="Check MongoDB",
            summary="MongoDB Health Check",
            response_description="Verbindungsstatus zur MongoDB",
            tags=["🔍 System"],
            status_code=200,
            responses={
                200: {
                    'model': DbHealthResponse,
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
async def mongodb_health(
    _user = Depends(require_role(UserRole.admin))
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