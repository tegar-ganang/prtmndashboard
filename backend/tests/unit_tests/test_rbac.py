import types

import fastapi
import pytest

from src.api.dependencies.rbac import require_menu_access


async def test_admin_bypasses_menu_matrix_even_without_role() -> None:
    admin = types.SimpleNamespace(is_admin=True, role_id=None, role_name=None)
    check = require_menu_access("project", require_upload=True)
    assert await check(current_account=admin, async_session=None) is admin


async def test_non_admin_without_role_is_forbidden() -> None:
    user = types.SimpleNamespace(is_admin=False, role_id=None, role_name=None)
    with pytest.raises(fastapi.HTTPException) as exc:
        await require_menu_access("project", require_upload=True)(current_account=user, async_session=None)
    assert exc.value.status_code == 403
