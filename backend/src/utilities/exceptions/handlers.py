import fastapi
import loguru
from fastapi.responses import JSONResponse


def _build_error_payload(message: str, err: str | dict | list | None) -> dict:
    return {
        "success": False,
        "message": message,
        "data": None,
        "err": err,
    }


async def http_exception_handler(_: fastapi.Request, exc: fastapi.HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_build_error_payload(message="Request failed", err=exc.detail),
    )


async def unhandled_exception_handler(_: fastapi.Request, exc: Exception) -> JSONResponse:
    # Never echo the raw exception back to the client — it can leak internal
    # details (table/column names, driver errors). Log it server-side instead.
    loguru.logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_build_error_payload(message="Internal server error", err=None),
    )
