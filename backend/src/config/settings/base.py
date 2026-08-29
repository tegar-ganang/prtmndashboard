import logging
import pathlib
import typing
import decouple
import pydantic

ROOT_DIR: pathlib.Path = pathlib.Path(__file__).parent.parent.parent.parent.parent.resolve()


class BackendBaseSettings(pydantic.BaseSettings):
    TITLE: str = "DAPSQL FARN-Stack Template Application"
    VERSION: str = "0.1.0"
    TIMEZONE: str = "UTC"
    DESCRIPTION: str = ""
    DEBUG: bool = False

    SERVER_HOST: str = decouple.config("BACKEND_SERVER_HOST", cast=str)  # type: ignore
    SERVER_PORT: int = decouple.config("BACKEND_SERVER_PORT", cast=int)  # type: ignore
    SERVER_WORKERS: int = decouple.config("BACKEND_SERVER_WORKERS", cast=int)  # type: ignore
    API_PREFIX: str = "/api"
    DOCS_URL: str = "/docs"
    OPENAPI_URL: str = "/openapi.json"
    REDOC_URL: str = "/redoc"
    OPENAPI_PREFIX: str = ""

    DB_POSTGRES_HOST: str = decouple.config("POSTGRES_HOST", cast=str)  # type: ignore
    DB_MAX_POOL_CON: int = decouple.config("DB_MAX_POOL_CON", cast=int)  # type: ignore
    DB_POSTGRES_NAME: str = decouple.config("POSTGRES_DB", cast=str)  # type: ignore
    DB_POSTGRES_PASSWORD: str = decouple.config("POSTGRES_PASSWORD", cast=str)  # type: ignore
    DB_POOL_SIZE: int = decouple.config("DB_POOL_SIZE", cast=int)  # type: ignore
    DB_POOL_OVERFLOW: int = decouple.config("DB_POOL_OVERFLOW", cast=int)  # type: ignore
    DB_POSTGRES_PORT: int = decouple.config("POSTGRES_PORT", cast=int)  # type: ignore
    DB_POSTGRES_SCHEMA: str = decouple.config("POSTGRES_SCHEMA", cast=str)  # type: ignore
    DB_TIMEOUT: int = decouple.config("DB_TIMEOUT", cast=int)  # type: ignore
    DB_POSTGRES_USERNAME: str = decouple.config("POSTGRES_USERNAME", cast=str)  # type: ignore

    IS_DB_ECHO_LOG: bool = decouple.config("IS_DB_ECHO_LOG", cast=bool)  # type: ignore
    IS_DB_FORCE_ROLLBACK: bool = decouple.config("IS_DB_FORCE_ROLLBACK", cast=bool)  # type: ignore
    IS_DB_EXPIRE_ON_COMMIT: bool = decouple.config("IS_DB_EXPIRE_ON_COMMIT", cast=bool)  # type: ignore

    API_TOKEN: str = decouple.config("API_TOKEN", cast=str)  # type: ignore
    AUTH_TOKEN: str = decouple.config("AUTH_TOKEN", cast=str)  # type: ignore
    JWT_TOKEN_PREFIX: str = decouple.config("JWT_TOKEN_PREFIX", cast=str)  # type: ignore
    JWT_SECRET_KEY: str = decouple.config("JWT_SECRET_KEY", cast=str)  # type: ignore
    JWT_SUBJECT: str = decouple.config("JWT_SUBJECT", cast=str)  # type: ignore
    JWT_MIN: int = decouple.config("JWT_MIN", cast=int)  # type: ignore
    JWT_HOUR: int = decouple.config("JWT_HOUR", cast=int)  # type: ignore
    JWT_DAY: int = decouple.config("JWT_DAY", cast=int)  # type: ignore
    JWT_ACCESS_TOKEN_EXPIRATION_TIME: int = JWT_MIN * JWT_HOUR * JWT_DAY

    IS_ALLOWED_CREDENTIALS: bool = decouple.config("IS_ALLOWED_CREDENTIALS", cast=bool)  # type: ignore
    # Comma-separated list, e.g. "https://dashboard.example.com,https://staging.example.com".
    # Falls back to local dev ports when unset so local development keeps working out of the box.
    ALLOWED_ORIGINS: list[str] = decouple.config(  # type: ignore
        "BACKEND_CORS_ORIGINS",
        cast=lambda value: [origin.strip() for origin in value.split(",") if origin.strip()],
        default=(
            "http://localhost:3000,http://0.0.0.0:3000,http://127.0.0.1:3000,http://127.0.0.1:3001,"
            "http://localhost:5173,http://0.0.0.0:5173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://103.174.115.172"
        ),
    )
    ALLOWED_METHODS: list[str] = ["*"]
    ALLOWED_HEADERS: list[str] = ["*"]

    # Comma-separated list of emails to auto-promote to is_admin on every startup.
    # Bootstraps the first admin without manual DB surgery — just sign up with this
    # email, restart the backend, and the account gets is_admin=True.
    ADMIN_EMAILS: list[str] = decouple.config(  # type: ignore
        "ADMIN_EMAILS",
        cast=lambda value: [email.strip().lower() for email in value.split(",") if email.strip()],
        default="",
    )

    # There's no self-signup flow, so admins create accounts directly — every account
    # they create gets this shared password. The user changes it themselves afterwards
    # via the Profile page (which requires knowing the current password).
    DEFAULT_USER_PASSWORD: str = decouple.config("DEFAULT_USER_PASSWORD", cast=str, default="Pertamina@2026")  # type: ignore

    LOGGING_LEVEL: int = logging.INFO
    LOGGERS: tuple[str, str] = ("uvicorn.asgi", "uvicorn.access")

    HASHING_ALGORITHM_LAYER_1: str = decouple.config("HASHING_ALGORITHM_LAYER_1", cast=str)  # type: ignore
    HASHING_ALGORITHM_LAYER_2: str = decouple.config("HASHING_ALGORITHM_LAYER_2", cast=str)  # type: ignore
    HASHING_SALT: str = decouple.config("HASHING_SALT", cast=str)  # type: ignore
    JWT_ALGORITHM: str = decouple.config("JWT_ALGORITHM", cast=str)  # type: ignore

    class Config(pydantic.BaseConfig):
        case_sensitive: bool = True
        env_file: str = f"{str(ROOT_DIR)}/.env"
        validate_assignment: bool = True

    @property
    def set_backend_app_attributes(self) -> dict[str, str | bool | None]:
        """
        Set all `FastAPI` class' attributes with the custom values defined in `BackendBaseSettings`.
        """
        # Swagger/ReDoc/OpenAPI schema expose the full API surface; only serve them when DEBUG is on.
        return {
            "title": self.TITLE,
            "version": self.VERSION,
            "debug": self.DEBUG,
            "description": self.DESCRIPTION,
            "docs_url": self.DOCS_URL if self.DEBUG else None,
            "openapi_url": self.OPENAPI_URL if self.DEBUG else None,
            "redoc_url": self.REDOC_URL if self.DEBUG else None,
            "openapi_prefix": self.OPENAPI_PREFIX,
            "api_prefix": self.API_PREFIX,
        }
