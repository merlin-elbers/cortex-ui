from typing import Annotated
from fastapi import Path
from pydantic import BaseModel
from application.modules.database_models import GetUser


# region Response Schemas

class GeneralException(Exception):
    def __init__(self, exception: str, status: str, status_code: int = 400, is_ok: bool = False):
        self.exception = exception
        self.status_code = status_code
        self.isOk = is_ok
        self.status = status


class BaseResponse(BaseModel):
    isOk: Annotated[bool, Path(title='Status', description='Zeigt an, ob die CRUD-Operation erfolgreich war oder nicht')] = True
    status: Annotated[str, Path(title='Statuscode', description='Systeminterner Statuscode')] = "OK"
    message: Annotated[str, Path(title='Statusnachricht', description='Diese Nachricht beschreit den Statuscode oder die CRUD-Operation näher')] = "Erfolgreiche Aktion"


class ValidationErrorDescription(BaseModel):
    exception: Annotated[str, Path(title='Fehler', description='Der Fehler, welcher einer CRUD-Operation aufgetreten ist')] = "Exception"
    errorType: Annotated[str, Path(title='Fehlertyp', description='Der Typ des Fehlers, welcher aufgetreten ist')] = "Error"
    location: Annotated[list[str], Path(title='URI', description='Die URI, bei dessen Aufruf der Fehler aufgetreten ist')] = ["/"]


class ValidationError(BaseModel):
    isOk: Annotated[bool, Path(title='Status', description='Zeigt an, ob die CRUD-Operation erfolgreich war oder nicht')] = False
    status: Annotated[str, Path(title='Statuscode', description='Der Systeminterne Statuscode, welcher anzeigt, was die CRUD-Operation gemacht hat')] = "INTERNAL_ERROR"
    message: list[ValidationErrorDescription] = []


class PaginationResponse(BaseResponse):
    page: Annotated[int, Path(title="Seite", description="Die aktuelle Seite der Ergebnisse")]
    pagesLeft: Annotated[int, Path(title="Verbleibende Seiten",
                                   description="Anzahl der verbleibenden Seiten, bis das Ende erreicht ist.")]
    pagesTotal: Annotated[int, Path(title="Anzahl aller Seiten",
                                    description="Anzahl der Seiten.")]


class AuthResponse(BaseResponse):
    data: GetUser

# endregion