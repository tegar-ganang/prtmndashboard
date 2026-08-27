import datetime

import pydantic

from src.models.schemas.base import BaseSchemaModel


class AccountInCreate(BaseSchemaModel):
    email: pydantic.EmailStr
    password: str
    name: str | None


class AccountAdminCreate(BaseSchemaModel):
    """Account creation by an admin — no self-signup flow exists yet, so this is
    how new users are onboarded. Admin-created accounts are active/verified
    immediately (no email-verification step exists in this app), and always get
    the shared DEFAULT_USER_PASSWORD — admins never choose or see a user's
    password. The user changes it themselves via the Profile page."""

    email: pydantic.EmailStr
    name: str | None
    role_id: int | None = None


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
    role_name: str | None = None
    is_admin: bool = False
    is_verified: bool
    is_active: bool
    is_logged_in: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class AccountInResponse(BaseSchemaModel):
    id: str
    authorized_account: AccountWithToken


class AccountPublic(BaseSchemaModel):
    """Account view with no token. Never mint a token for reads of an account that isn't the caller."""

    id: str
    email: pydantic.EmailStr
    name: str | None
    role_id: int | None = None
    role_name: str | None = None
    is_admin: bool = False
    is_verified: bool
    is_active: bool
    is_logged_in: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class RoleOut(BaseSchemaModel):
    id: int
    role_name: str


class AccountRoleUpdate(BaseSchemaModel):
    role_id: int | None


class AccountStatusUpdate(BaseSchemaModel):
    is_active: bool


class ChangePasswordRequest(BaseSchemaModel):
    current_password: str
    new_password: str
