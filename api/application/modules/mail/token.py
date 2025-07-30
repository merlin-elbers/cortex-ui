import httpx
import json
from pathlib import Path
from application.modules.database.database_models import Microsoft365
from application.modules.utils.crypto import decrypt_password


TOKEN_PATH = Path("tokens", "mail_token.txt")


async def refresh_m365_token():
    if not TOKEN_PATH.exists():
        raise FileNotFoundError("Token-Datei fehlt: tokens/mail_token.txt")

    content = TOKEN_PATH.read_text().strip()
    try:
        token_data = json.loads(content)
        refresh_token = token_data.get("refresh_token", content)
    except json.JSONDecodeError:
        refresh_token = content

    microsoft_config = await Microsoft365.find_one()

    if not microsoft_config:
        raise Exception("Microsoft365 Konfiguration wurde nicht gefunden")

    token_url = f"https://login.microsoftonline.com/{microsoft_config.tenantId}/oauth2/v2.0/token"

    data = {
        "client_id": microsoft_config.clientId,
        "client_secret": decrypt_password(microsoft_config.clientSecret),
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "scope": "https://graph.microsoft.com/.default offline_access"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)

    if response.status_code != 200:
        raise Exception(f"Token Refresh fehlgeschlagen: {response.status_code} {response.text}")

    token_json = response.json()

    TOKEN_PATH.write_text(json.dumps(token_json, indent=2))

    return token_json["access_token"]
