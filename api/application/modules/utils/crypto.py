from cryptography.fernet import Fernet
from application.modules.utils.settings import get_settings


def get_fernet():
    settings = get_settings()
    return Fernet(settings.FERNET_KEY)

def encrypt_password(password: str) -> str:
    return get_fernet().encrypt(password.encode()).decode()

def decrypt_password(token: str) -> str:
    return get_fernet().decrypt(token.encode()).decode()
