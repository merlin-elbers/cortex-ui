from pathlib import Path

from dotenv import dotenv_values
from pydantic.v1 import BaseSettings

if not Path(".env").exists():
    from application.modules.setup.setup_env import setup_env
    setup_env()


class Settings(BaseSettings):
    SELF_SIGNUP: bool
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    ALGORITHM: str
    SECRET_KEY: str
    FERNET_KEY: str
    MONGODB_URI: str
    MONGODB_DB_NAME: str
    VERSION: str
    API_PREFIX: str
    EMAIL_VERIFICATION: bool
    SETUP_COMPLETED: bool
    EXTERNAL_URL: str

    class Config:
        env_file = ".env"


def get_settings():
    values = dotenv_values(Path(".env"))
    return Settings(**values)
