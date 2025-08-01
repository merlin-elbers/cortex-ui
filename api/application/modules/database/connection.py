from logging import Logger
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from application.modules.database.database_models import User, Logins, Microsoft365, SMTPServer, WhiteLabelConfig, \
    MatomoConfig, EmailVerification, PublicKeys
from application.modules.utils.settings import Settings


async def init_db(logger: Logger, settings: Settings):
    mongo_uri = settings.MONGODB_URI
    db_name = settings.MONGODB_DB_NAME or "cortex-ui"

    if not mongo_uri:
        logger.critical("❌ Kein MONGODB_URI gefunden – Startup abgebrochen.")
        raise ValueError("MongoDB URI fehlt in der .env")

    logger.info(f"🔌 Verbindung zu MongoDB wird aufgebaut → {mongo_uri} / DB: {db_name}")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_database(db_name)
    document_models = [
            User,
            Logins,
            Microsoft365,
            SMTPServer,
            MatomoConfig,
            WhiteLabelConfig,
            EmailVerification,
            PublicKeys
        ]

    await init_beanie(
        database=db,
        document_models=document_models,
    )

    logger.info("✅ Beanie Models registriert & Indexe sichergestellt.")
    logger.info(f"📦 {len(document_models)} Models geladen – DB ready")
