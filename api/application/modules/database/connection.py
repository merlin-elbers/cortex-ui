from dotenv import load_dotenv
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
from contextlib import asynccontextmanager
from application.modules.database.database_models import User, Logins, Microsoft365, SMTPServer, WhiteLabelConfig, \
    MatomoConfig, EmailVerification
from application.modules.utils.logger import get_logger
from application.modules.utils.settings import get_settings

load_dotenv()

logger = get_logger('database')


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()

    if settings.SETUP_COMPLETED:
        try:
            await init_db()
            logger.info("✅ MongoDB initialisiert.")
        except Exception as e:
            logger.error(f"❌ Fehler beim Initialisieren der MongoDB: {e}")
            raise e
    else:
        logger.warning("⚠️ Setup nicht abgeschlossen – MongoDB-Init übersprungen.")
    yield


async def init_db():
    settings = get_settings()

    mongo_uri = settings.MONGODB_URI
    db_name = settings.MONGODB_DB_NAME or "cortex-ui"

    if not mongo_uri:
        logger.critical("❌ Kein MONGODB_URI gefunden – Startup abgebrochen.")
        raise ValueError("MongoDB URI fehlt in der .env")

    logger.info(f"🔌 Verbindung zu MongoDB wird aufgebaut → {mongo_uri} / DB: {db_name}")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_database(db_name)

    await init_beanie(
        database=db,
        document_models=[User, Logins, Microsoft365, SMTPServer, MatomoConfig, WhiteLabelConfig, EmailVerification],
    )

    logger.info("✅ Beanie Models registriert & Indexe sichergestellt.")
    return db
