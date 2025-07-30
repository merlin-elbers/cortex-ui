import secrets
from pathlib import Path
from dotenv import dotenv_values, set_key
from cryptography.fernet import Fernet


def setup_env(
        secret_key: str = None,
        fernet_key: str = None,
        mongodb_uri: str = None,
        mongodb_db_name: str = None,
        self_signup: str = None,
        email_verification: str = None,
        setup_completed: str = None,
        external_url: str = None,
):
    env_file = Path(".env")

    default_env = {
        "SELF_SIGNUP": "false",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "60",
        "ALGORITHM": "HS256",
        "SECRET_KEY": "",
        "FERNET_KEY": "",
        "MONGODB_URI": "",
        "MONGODB_DB_NAME": "",
        "VERSION": "1.0.0",
        "API_PREFIX": "/api/v1",
        "EMAIL_VERIFICATION": "false",
        "SETUP_COMPLETED": "false",
        "EXTERNAL_URL": "http://localhost:3000/",
    }

    if not env_file.exists():
        with open(env_file, "w") as f:
            for key, val in default_env.items():
                f.write(f"{key}={val}\n")

    current_env = dotenv_values(env_file)

    updates = {
        "SECRET_KEY": secret_key or current_env.get("SECRET_KEY") or secrets.token_urlsafe(64),
        "FERNET_KEY": fernet_key or current_env.get("FERNET_KEY") or Fernet.generate_key().decode(),
        "MONGODB_URI": mongodb_uri or current_env.get("MONGODB_URI") or "",
        "MONGODB_DB_NAME": mongodb_db_name or current_env.get("MONGODB_DB_NAME") or "",
        "EMAIL_VERIFICATION": email_verification or current_env.get("EMAIL_VERIFICATION"),
        "SELF_SIGNUP": self_signup or current_env.get("SELF_SIGNUP"),
        "SETUP_COMPLETED": setup_completed or current_env.get("SETUP_COMPLETED"),
        "EXTERNAL_URL": external_url or current_env.get("EXTERNAL_URL"),
    }

    for key, value in updates.items():
        set_key(str(env_file), key, str(value))
