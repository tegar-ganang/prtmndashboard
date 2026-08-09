import uuid

import fastapi
import pytest

from src.utilities.rate_limiter import enforce_rate_limit


class TestRateLimiter:
    def test_allows_requests_under_the_limit(self) -> None:
        key = uuid.uuid4().hex

        for _ in range(3):
            enforce_rate_limit(key, max_attempts=3, window_seconds=60)

    def test_blocks_requests_over_the_limit(self) -> None:
        key = uuid.uuid4().hex

        for _ in range(3):
            enforce_rate_limit(key, max_attempts=3, window_seconds=60)

        with pytest.raises(fastapi.HTTPException) as exc_info:
            enforce_rate_limit(key, max_attempts=3, window_seconds=60)

        assert exc_info.value.status_code == fastapi.status.HTTP_429_TOO_MANY_REQUESTS

    def test_different_keys_are_tracked_independently(self) -> None:
        key_a, key_b = uuid.uuid4().hex, uuid.uuid4().hex

        for _ in range(3):
            enforce_rate_limit(key_a, max_attempts=3, window_seconds=60)

        enforce_rate_limit(key_b, max_attempts=3, window_seconds=60)
