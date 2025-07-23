from typing import Annotated, List
from fastapi import Path
from pydantic import BaseModel

from application.modules.utils.schemas import GetUser


# region Response Schemas

class GeneralException(Exception):
    def __init__(self, exception: str, status: str, status_code: int = 400, is_ok: bool = False):
        self.exception = exception
        self.status_code = status_code
        self.isOk = is_ok
        self.status = status


class GeneralExceptionSchema(BaseModel):
    isOk: Annotated[bool, Path(
        title='Status',
        description='Zeigt an, ob die CRUD-Operation erfolgreich war')
    ] = False
    status: Annotated[str, Path(
        title='Statuscode',
        description='Systeminterner Statuscode')
    ] = "FAILED"
    exception: Annotated[str, Path(
        title='Statusnachricht',
        description='Diese Nachricht beschreibt den Statuscode oder die CRUD-Operation näher')
    ] = "Fehler in der Anfrage"


class BaseResponse(BaseModel):
    isOk: Annotated[bool, Path(
        title='Status',
        description='Zeigt an, ob die CRUD-Operation erfolgreich war')
    ] = True
    status: Annotated[str, Path(
        title='Statuscode',
        description='Systeminterner Statuscode')
    ] = "OK"
    message: Annotated[str, Path(
        title='Statusnachricht',
        description='Diese Nachricht beschreibt den Statuscode oder die CRUD-Operation näher')
    ] = "Erfolgreiche Aktion"


class ValidationErrorDescription(BaseModel):
    exception: Annotated[str, Path(
        title='Fehler',
        description='Der Fehler, welcher in einer CRUD-Operation aufgetreten ist')
    ] = "Exception"
    errorType: Annotated[str, Path(
        title='Fehlertyp',
        description='Der Typ des Fehlers, welcher aufgetreten ist')
    ] = "Error"
    location: Annotated[list[str], Path(
        title='URI',
        description='Die URI, bei dessen Aufruf der Fehler aufgetreten ist')
    ] = ["/"]


class ValidationError(BaseModel):
    isOk: Annotated[bool, Path(
        title='Status',
        description='Zeigt an, ob die CRUD-Operation erfolgreich war')
    ] = False
    status: Annotated[str, Path(
        title='Statuscode',
        description='Ein Systeminterner Statuscode')
    ] = "INTERNAL_ERROR"
    message: list[ValidationErrorDescription] = []


class PaginationResponse(BaseResponse):
    page: Annotated[int, Path(
        title="Seite",
        description="Die aktuelle Seite der Ergebnisse")
    ]
    pagesLeft: Annotated[int, Path(
        title="Verbleibende Seiten",
        description="Anzahl der verbleibenden Seiten, bis das Ende erreicht ist.")
    ]
    pagesTotal: Annotated[int, Path(
        title="Anzahl aller Seiten",
        description="Anzahl der Seiten.")
    ]


class AuthResponse(BaseResponse):
    data: GetUser


class UsersResponse(BaseResponse):
    data: List[GetUser]
    todaysLogins: int
    administrators: int
    activeUsers: int


class PingResponse(BaseResponse):
    latencyMs: float


class DbHealthResponse(PingResponse):
    dbName: str
    serverVersion: str
    uptimeSeconds: float | int
    connectionCount: int
    indexes: int | str
    storageSizeMB: float


class BackupResponse(BaseResponse):
    fileName: str


class MicrosoftResponse(BaseResponse):
    email: str
    displayName: str


# endregion
