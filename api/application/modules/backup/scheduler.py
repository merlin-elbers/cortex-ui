from pathlib import Path
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import subprocess
import os
from application.modules.setup.setup_env import BackupFrequency
from application.modules.utils.logger import get_logger
from application.modules.utils.settings import get_settings

scheduler: BackgroundScheduler | None = None


def run_mongo_backup():
    settings = get_settings()
    logger = get_logger("backup")
    now = datetime.now().strftime("%Y-%m-%d-%H-%M")
    filename = f"cortexui-backup-{now}.gz"
    backup_path = Path('backups')

    if not backup_path.exists():
        backup_path.mkdir(parents=True)

    try:
        uri = settings.MONGODB_URI
        if not uri:
            raise Exception("MONGODB_URI is required")

        result = subprocess.run([
            "mongodump",
            f"--uri={uri}",
            f"--db={settings.MONGODB_DB_NAME}",
            f"--archive={os.path.join(backup_path, filename)}",
            "--gzip"
        ], capture_output=True)

        if result.returncode == 0:
            logger.info(f"Backup erfolgreich: {filename}")
        else:
            logger.error(f"Fehler beim Backup. Fehlercode {result.returncode}")
            logger.error(f"stderr: {result.stderr.decode('utf-8')}")
            logger.error(f"stdout: {result.stdout.decode('utf-8')}")
    except Exception as e:
        logger.error(f"Fehler beim Backup: {e}")

    clean_old_backups(backup_path, settings.BACKUP_CLEANUP)


def clean_old_backups(backup_dir: Path, max_age_days: int = 10):
    logger = get_logger("backup")
    now = datetime.now()

    if not backup_dir.exists():
        logger.info(f"Backup-Verzeichnis existiert nicht: {backup_dir}")
        return

    deleted = 0
    for file in backup_dir.iterdir():
        if file.is_file():
            mtime = datetime.fromtimestamp(file.stat().st_mtime)
            if now - mtime > timedelta(days=max_age_days):
                try:
                    file.unlink()
                    logger.info(f"Datei gelöscht: {file.name}")
                    deleted += 1
                except Exception as e:
                    logger.error(f"Fehler beim Löschen von {file.name}: {e}")

    logger.info(f"{deleted} Backups, die älter als {max_age_days} Tage alt sind, wurden gelöscht.")


def start_backup_scheduler():
    global scheduler
    if scheduler and scheduler.running:
        return

    logger = get_logger("backup")
    settings = get_settings()

    if settings.BACKUP_STARTED:
        scheduler = BackgroundScheduler()

        if settings.BACKUP_FREQUENCY == BackupFrequency.daily:
            scheduler.add_job(run_mongo_backup, 'cron', hour=3, minute=0)
        elif settings.BACKUP_FREQUENCY == BackupFrequency.weekly:
            scheduler.add_job(run_mongo_backup, 'cron', day_of_week='sun', hour=3)
        elif settings.BACKUP_FREQUENCY == BackupFrequency.monthly:
            scheduler.add_job(run_mongo_backup, 'cron', day=1, hour=3)

        scheduler.start()
        logger.info("✅ Backup-Scheduler gestartet")
    else:
        logger.info("⏸ BACKUP_STARTED ist nicht gesetzt – Scheduler nicht gestartet")


def stop_backup_scheduler():
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        scheduler = None


def is_scheduler_running() -> bool:
    return scheduler is not None and scheduler.running
