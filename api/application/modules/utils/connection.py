import os
from dotenv import load_dotenv
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
from contextlib import asynccontextmanager
from application.modules.utils.database_models import User, Logins, Microsoft365
from application.modules.utils.logger import get_logger

load_dotenv()

logger = get_logger('database')


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await init_db()
        logger.info("✅ MongoDB initialisiert.")
    except Exception as e:
        logger.error(f"❌ Fehler beim Initialisieren der MongoDB: {e}")
        raise e
    yield


async def init_db():
    mongo_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "cortex-ui")

    if not mongo_uri:
        logger.critical("❌ Kein MONGODB_URI gefunden – Startup abgebrochen.")
        raise ValueError("MongoDB URI fehlt in der .env (.env → MONGODB_URI)")

    logger.info(f"🔌 Verbindung zu MongoDB wird aufgebaut → {mongo_uri} / DB: {db_name}")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_database(db_name)

    await init_beanie(
        database=db,
        document_models=[User, Logins, Microsoft365],
    )

    logger.info("✅ Beanie Models registriert & Indexe sichergestellt.")
    return db
