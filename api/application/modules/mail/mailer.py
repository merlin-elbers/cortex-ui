import json
from jinja2 import Environment, FileSystemLoader, select_autoescape
from email.message import EmailMessage
from pathlib import Path
from typing import Literal
import aiosmtplib
import httpx
from application.modules.database.database_models import SMTPServer, Microsoft365
from application.modules.mail.token import refresh_m365_token
from application.modules.utils.crypto import decrypt_password
import base64

env = Environment(
    loader=FileSystemLoader("application/modules/mail/templates"),
    autoescape=select_autoescape(['html', 'xml'])
)


def get_smtp_tls_options(port: int) -> dict:
    """
    Gibt die richtigen TLS-Optionen für aiosmtplib.send() zurück
    basierend auf dem SMTP-Port.
    """
    if port == 465:
        return {"use_tls": True}
    elif port == 587:
        return {"start_tls": True}
    else:
        return {}


def get_base64_image(path: str, mime_type: str = "image/png") -> str:
    data = Path(path).read_bytes()
    encoded = base64.b64encode(data).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def prepare_base64_image(data: str, mime_type="image/png") -> str:
    if data.startswith("data:"):
        return data
    return f"data:{mime_type};base64,{data}"


async def send_html_email(
        to_email: str,
        subject: str,
        template_name: str,
        context: dict,
        mode: Literal["smtp", "m365"] = "smtp"
):
    template = env.get_template(template_name)
    html_content = template.render(**context)

    if mode == "smtp":
        await send_via_smtp(to_email, subject, html_content)
    elif mode == "m365":
        await send_via_m365(to_email, subject, html_content)
    else:
        raise ValueError("Unknown send mode. Use 'smtp' or 'm365'.")


async def send_via_smtp(to_email: str, subject: str, html_content: str):
    smtp_config = await SMTPServer.find_one()

    if not smtp_config:
        raise Exception("SMTP Konfiguration wurde nicht gefunden")

    message = EmailMessage()
    message["From"] = f"{smtp_config.senderName} <{smtp_config.senderEmail}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content("Dein E-Mail Client unterstützt keine HTML-Mails.")
    message.add_alternative(html_content, subtype="html")

    tls_options = get_smtp_tls_options(smtp_config.port)

    await aiosmtplib.send(
        message,
        hostname=smtp_config.host,
        port=smtp_config.port,
        username=smtp_config.username,
        password=decrypt_password(smtp_config.password),
        **tls_options
    )


async def send_via_m365(to_email: str, subject: str, html_content: str):
    if not Microsoft365.find_one():
        raise Exception("Microsoft365 Konfiguration wurde nicht gefunden")

    async def get_token():
        token_path = Path("tokens", "mail_token.txt")
        if not token_path.exists():
            raise FileNotFoundError("Token-Datei fehlt: tokens/mail_token.txt")

        content = token_path.read_text().strip()
        try:
            token_data = json.loads(content)
            return token_data.get("access_token", content)
        except json.JSONDecodeError:
            return content

    async def send_mail(m365_token: str):
        graph_url = "https://graph.microsoft.com/v1.0/me/sendMail"
        payload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": html_content
                },
                "toRecipients": [
                    {"emailAddress": {"address": to_email}}
                ]
            },
            "saveToSentItems": "true"
        }

        headers = {
            "Authorization": f"Bearer {m365_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            return await client.post(graph_url, json=payload, headers=headers)

    access_token = await get_token()
    response = await send_mail(access_token)

    if response.status_code in (401, 403):
        new_token = await refresh_m365_token()
        response = await send_mail(new_token)

    if response.status_code != 202:
        raise Exception(f"M365 Mail send failed: {response.status_code} {response.text}")
