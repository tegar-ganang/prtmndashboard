import fastapi
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from src.api.endpoints import router as api_endpoint_router
from src.api.middlewares.authentication import JWTAuthenticationMiddleware
from src.config.events import execute_backend_server_event_handler, terminate_backend_server_event_handler
from src.config.manager import settings
from src.utilities.exceptions.handlers import http_exception_handler, unhandled_exception_handler


def initialize_backend_application() -> fastapi.FastAPI:
    app = fastapi.FastAPI(**settings.set_backend_app_attributes)  # type: ignore

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=settings.IS_ALLOWED_CREDENTIALS,
        allow_methods=settings.ALLOWED_METHODS,
        allow_headers=settings.ALLOWED_HEADERS,
    )
    app.add_middleware(JWTAuthenticationMiddleware)

    app.add_event_handler(
        "startup",
        execute_backend_server_event_handler(backend_app=app),
    )
    app.add_event_handler(
        "shutdown",
        terminate_backend_server_event_handler(backend_app=app),
    )

    app.include_router(router=api_endpoint_router, prefix=settings.API_PREFIX)
    app.add_exception_handler(fastapi.HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    return app


backend_app: fastapi.FastAPI = initialize_backend_application()

if __name__ == "__main__":
    uvicorn.run(
        app="main:backend_app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.DEBUG,
        workers=settings.SERVER_WORKERS,
        log_level=settings.LOGGING_LEVEL,
    )
