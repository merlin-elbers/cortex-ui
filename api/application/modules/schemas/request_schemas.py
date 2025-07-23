from enum import Enum

from pydantic import BaseModel


class SortType(Enum):
    asc = "asc"
    desc = "desc"


class M365TokenRequest(BaseModel):
    clientId: str
    clientSecret: str
    tenantId: str
    code: str
    redirect_uri: str
