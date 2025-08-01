import datetime
import secrets
from typing import Literal, Optional, List

import uuid6
from pydantic import BaseModel
from pydantic import HttpUrl


class GetUser(BaseModel):
    uid: str
    email: str
    firstName: str
    lastName: str
    role: str
    isActive: bool
    lastSeen: datetime.datetime
    accessToken: str | None

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
            "accessToken": "<BEARER TOKEN>",
        }


class CreateUserSelf(BaseModel):
    email: str
    password: str
    firstName: Optional[str]
    lastName: Optional[str]

    class Config:
        json_schema_extra = {
            "email": "john.doe@cortex.ui",
            "password": "John.Doe1092!",
            "firstName": "John",
            "lastName": "Doe",
        }


class CreateUserAdmin(CreateUserSelf):
    role: Literal["viewer", "writer", "editor", "admin"] = 'viewer'
    isActive: Optional[bool] = False

    class Config:
        json_schema_extra = {
            "email": "john.doe@cortex.ui",
            "password": "John.Doe1092!",
            "firstName": "John",
            "lastName": "Doe",
            "role": "admin",
            "isActive": True,
        }


class UpdateUser(BaseModel):
    email: Optional[str]
    password: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]
    role: Optional[Literal["admin", "editor", "writer", "viewer"]]
    isActive: Optional[bool]

    class Config:
        json_schema_extra = {
            "email": "john.doe@cortex.ui",
            "password": "John.Doe1092!",
            "firstName": "John",
            "lastName": "Doe",
            "role": "admin",
            "isActive": True,
        }


class MatomoSummaryItem(BaseModel):
    label: str
    icon: str | None = None
    number: int | float
    trend: str
    trendLabel: str = "%"


class MatomoTopPage(BaseModel):
    url: str
    visitsLastWeek: int
    averageTimeLastWeek: int
    bounceRateLastWeek: float
    exitRateLastWeek: float
    averageLoadTimeLastWeek: float


class MatomoTopReferrer(BaseModel):
    label: str
    visitsLastWeek: int
    actionsLastWeek: int
    averageSessionLengthLastWeek: int
    bounceRateLastWeek: float


class MatomoTopCountry(BaseModel):
    country: str
    visitsLastWeek: int
    actionsLastWeek: int
    averageSessionLengthLastWeek: int
    bounceRateLastWeek: float
    logo: str


class MatomoAnalytics(BaseModel):
    summary: List[MatomoSummaryItem]
    topCountries: List[MatomoTopCountry]
    topReferrers: List[MatomoTopReferrer]
    topPages: List[MatomoTopPage]
    url: HttpUrl


class ServerStatusSchema(BaseModel):
    databaseOnline: bool
    selfSignupEnabled: bool
    smtpServerConfigured: bool
    m365Configured: bool
    matomoConfigured: bool


class DatabaseHealthSchema(BaseModel):
    dbName: str
    serverVersion: str
    uptimeSeconds: float | int
    connectionCount: int
    indexes: int | str
    storageSizeMB: float
    latencyMs: float


class PublicKeySchema(BaseModel):
    uid: str = str(uuid6.uuid7())
    key: str = secrets.token_urlsafe(32)
    name: str
    description: Optional[str] = None
    isActive: bool = True
    allowedIps: Optional[List[str]] = None
    expiredAt: Optional[datetime.datetime] = None
    createdBy: Optional[str] = None
    createdAt: datetime.datetime = datetime.datetime.now()
    lastUsedAt: Optional[datetime.datetime] = None
    metadata: Optional[dict] = None


class BackupFile(BaseModel):
    fileName: str
    createdAt: str | datetime.datetime
