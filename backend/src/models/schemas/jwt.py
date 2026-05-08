import datetime

import pydantic


class JWToken(pydantic.BaseModel):
    exp: datetime.datetime
    sub: str


class JWTAccount(pydantic.BaseModel):
    name: str | None = None
    email: pydantic.EmailStr
    role_id: int | None = None
    role_name: str | None = None
