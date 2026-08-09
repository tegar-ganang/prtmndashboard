import collections
import time

import fastapi

_attempts: dict[str, list[float]] = collections.defaultdict(list)


def enforce_rate_limit(key: str, *, max_attempts: int, window_seconds: int) -> None:
    now = time.monotonic()
    attempts = _attempts[key]
    attempts[:] = [attempt for attempt in attempts if now - attempt < window_seconds]

    if len(attempts) >= max_attempts:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please try again later.",
        )

    attempts.append(now)
