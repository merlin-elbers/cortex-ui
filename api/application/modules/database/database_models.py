import datetime
from typing import Optional, Literal
from beanie import Document, Indexed
from pydantic import Field, EmailStr
from enum import Enum
from pydantic import HttpUrl
from application.modules.schemas.request_schemas import BrandingLogo


class LoginStatus(Enum):
    success = True
    failed = False


class UserRole(Enum):
    viewer = ("viewer", 1)
    writer = ("writer", 2)
    editor = ("editor", 3)
    admin = ("admin", 4)

    def __init__(self, label: str, level: int):
        self._label = label
        self._level = level

    @property
    def label(self) -> str:
        return self._label

    @property
    def level(self) -> int:
        return self._level

    def __str__(self) -> str:
        return self._label


class User(Document):
    uid: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    password: str
    firstName: str
    lastName: str
    role: Literal["viewer", "writer", "editor", "admin"] = Field(default=UserRole.viewer.label)
    isActive: bool
    lastSeen: Optional[datetime.datetime] = None

    class Settings:
        name = "Users"

    class Config:
        json_schema_extra = {
            "uid": "01981d65-0881-786d-8e00-b7b25f19c88f",
            "email": "john.doe@cortex.ui",
            "password": "John.Doe1092!",
            "firstName": "John",
            "lastName": "Doe",
            "role": "admin",
            "isActive": True,
            "lastSeen": datetime.datetime.now(),
        }


class Logins(Document):
    userUid: str
    timestamp: datetime.datetime
    ipAddress: str
    userAgent: str
    status: LoginStatus

    class Settings:
        name = "Logins"

    class Config:
        json_schema_extra = {
          "userUid": "01981d65-0881-786d-8e00-b7b25f19c88f",
          "timestamp": "2025-07-21T09:13:00Z",
          "ipAddress": "91.11.234.56",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64...)",
          "status": True
        }


class Microsoft365(Document):
    uid: Indexed(str, unique=True)
    email: str
    displayName: str
    clientId: str
    clientSecret: str
    tenantId: str
    createdAt: datetime.datetime = Field(default_factory=datetime.datetime.now)

    class Settings:
        name = "Microsoft365"


class SMTPServer(Document):
    uid: Indexed(str, unique=True)
    host: str
    port: int
    username: str
    password: str
    senderName: str
    senderEmail: str

    class Settings:
        name = "SMTPServer"

    class Config:
        json_schema_extra = {
            "uid": "01981d65-0881-786d-8e00-b7b25f19c88f",
            "host": "smtp.cortex.ui",
            "port": 587,
            "username": "<EMAIL>",
            "password": "<PASSWORD>",
            "senderName": "CortexUI",
            "senderEmail": "noreply@cortex.ui",
        }


class MatomoConfig(Document):
    uid: Indexed(str, unique=True)
    matomoUrl: HttpUrl
    matomoSiteId: str | int
    matomoApiKey: str

    class Settings:
        name = "MatomoConfig"

    class Config:
        json_schema_extra = {
            "uid": "01981d65-0881-786d-8e00-b7b25f19c88f",
            "matomoUrl": "analytics.cortex.ui",
            "matomoSiteId": 1,
            "matomoApiKey": "<API_KEY>",
        }


class WhiteLabelConfig(Document):
    uid: Indexed(str, unique=True)
    logo: Optional[BrandingLogo] = None
    title: str
    showTitle: bool = False
    subtitle: Optional[str] = None
    description: Optional[str] = None
    contactMail: Optional[EmailStr] = None
    contactPhone: Optional[str] = None
    contactFax: Optional[str] = None

    class Settings:
        name = "WhiteLabelConfig"

    class Config:
        json_schema_extra = {
            "uid": "01981d65-0881-786d-8e00-b7b25f19c88f",
            "logo": {
                "contentType": "image/png",
                "name": "CortexLogo.png",
                "data": "<BASE_64_IMAGE_STRING>",
                "lastModified": datetime.datetime.now()
            },
            "title": "CortexUI Dashboard",
            "showTitle": False,
            "subtitle": "Innovatives, modernes und modulares Headless CMS",
            "description": "CortexUI ist ein hochmodernes, modulares Admin-Backend für datengetriebene Webanwendungen. Es kombiniert leistungsstarke Analytics, rollenbasiertes User Management, Content-Management und SMTP- und Microsoft365 Integration in einem leicht erweiterbaren Headless-System. Voll Open Source. Voller Fokus auf Developer Experience.",
            "contactMail": "info@cortex.ui",
            "contactPhone": "+49 123 456789",
            "contactFax": "+49 987 654321",
        }
