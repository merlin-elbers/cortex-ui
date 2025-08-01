from contextlib import asynccontextmanager
from fastapi import FastAPI
from application.modules.backup.scheduler import start_backup_scheduler
from application.modules.utils.logger import get_logger
from application.modules.utils.settings import get_settings
from application.modules.database.connection import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger = get_logger('database')
    settings = get_settings()

    if settings.SETUP_COMPLETED:
        try:
            await init_db(logger, settings)
            start_backup_scheduler()
            logger.info("✅ MongoDB initialisiert.")
        except Exception as e:
            logger.error(f"❌ Fehler beim Initialisieren der MongoDB: {e}")
            raise e
    else:
        logger.warning("⚠️ Setup nicht abgeschlossen – MongoDB-Init übersprungen.")
    yield
