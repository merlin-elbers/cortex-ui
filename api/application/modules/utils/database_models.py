import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from enum import Enum


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
    role: UserRole = Field(default=UserRole.viewer)
    isActive: bool
    lastSeen: datetime.datetime

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

    class Config:
        json_schema_extra = {
          "userUid": "01981d65-0881-786d-8e00-b7b25f19c88f",
          "timestamp": "2025-07-21T09:13:00Z",
          "ipAddress": "91.11.234.56",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64...)",
          "status": True
        }


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


class CreateUser(BaseModel):
    email: str
    password: str
    firstName: Optional[str]
    lastName: Optional[str]


class UpdateUser(BaseModel):
    email: Optional[str]
    password: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]
    role: Optional[str]
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

