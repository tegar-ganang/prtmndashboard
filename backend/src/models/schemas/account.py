import datetime

import pydantic

from src.models.schemas.base import BaseSchemaModel


class AccountInCreate(BaseSchemaModel):
    email: pydantic.EmailStr
    password: str
    name: str | None


class AccountInUpdate(BaseSchemaModel):
    email: str | None
    password: str | None
    name: str | None
    is_verified: bool | None
    is_active: bool | None
    is_logged_in: bool | None


class AccountInLogin(BaseSchemaModel):
    email: pydantic.EmailStr
    password: str


class AccountWithToken(BaseSchemaModel):
    token: str
    email: pydantic.EmailStr
    name: str | None
    is_verified: bool
    is_active: bool
    is_logged_in: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class AccountInResponse(BaseSchemaModel):
    id: str
    authorized_account: AccountWithToken
