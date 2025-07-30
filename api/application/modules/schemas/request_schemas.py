from enum import Enum
from pydantic import BaseModel, HttpUrl, EmailStr, constr, StringConstraints
from typing import Optional, Union, Annotated
from datetime import datetime


MailType = Annotated[str, StringConstraints(pattern="^(smtp|microsoft365)$")]


class SortType(Enum):
    asc = "asc"
    desc = "desc"


class AdminUser(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: constr(min_length=6)
    emailVerification: bool


class DatabaseConfig(BaseModel):
    uri: str
    dbName: str
    connectionTested: bool


class SelfSignup(BaseModel):
    enabled: bool


class BrandingLogo(BaseModel):
    contentType: Optional[str] = None
    name: Optional[str] = None
    data: Optional[str] = None
    lastModified: Optional[Union[str, datetime, int]] = None


class Branding(BaseModel):
    logo: Optional[BrandingLogo] = None
    title: str
    showTitle: bool = False
    externalUrl: HttpUrl
    subtitle: Optional[str] = None
    description: Optional[str] = None
    contactMail: Optional[EmailStr] = None
    contactPhone: Optional[str] = None
    contactFax: Optional[str] = None


class SMTPSettings(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    senderName: Optional[str] = None
    senderEmail: Optional[EmailStr] = None
    tested: Optional[bool] = None


class M365Settings(BaseModel):
    tenantId: Optional[str] = None
    clientId: Optional[str] = None
    secretKey: Optional[str] = None
    authenticated: Optional[bool] = None
    senderName: Optional[str] = None
    senderEmail: Optional[EmailStr] = None


class MailServer(BaseModel):
    type: MailType
    smtp: Optional[SMTPSettings] = None
    microsoft365: Optional[M365Settings] = None


class Analytics(BaseModel):
    matomoUrl: Optional[HttpUrl] = None
    matomoSiteId: Optional[str] = None
    matomoApiKey: Optional[str] = None
    connectionTested: Optional[bool] = None


class License(BaseModel):
    accepted: bool


class SetupData(BaseModel):
    adminUser: AdminUser
    database: DatabaseConfig
    selfSignup: SelfSignup
    branding: Branding
    mailServer: MailServer
    analytics: Analytics
    license: License


class M365TokenRequest(BaseModel):
    clientId: str
    clientSecret: str
    tenantId: str
    code: str
    redirect_uri: str


class VerifyRequest(BaseModel):
    code: str
