import loguru
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession as SQLAlchemyAsyncSession

from src.models.db.account import Account
from src.models.db.menu import Menu
from src.models.db.role import Role
from src.models.db.role_menu_access import RoleMenuAccess

# Menu names match the value passed to `require_menu_access()` in each route file.
MENUS = [
    "dashboard", "produksi", "project", "hsse", "lcv", "i2aims", "airms",
    "mit", "moc", "hazid", "hazop", "lopa", "location", "zona_indicator", "zona_pse_list",
]

ROLES = ["Executive", "Production Manager", "OSF Engineer", "Project Manager", "HSSE & Admin"]

# role_name -> {menu_name: (can_view, can_upload)}
# Mapped from RENCANA PENGUJIAN INTERNAL ITS.docx (5 role user matrix).
ACCESS: dict[str, dict[str, tuple[bool, bool]]] = {
    "Executive": {menu: (True, False) for menu in MENUS},  # cross-module consolidated view only
    "Production Manager": {
        "dashboard": (True, False),
        "produksi": (True, True),
        "location": (True, False),
        "zona_indicator": (True, False),
        "zona_pse_list": (True, False),
    },
    "OSF Engineer": {
        "dashboard": (True, False),
        "i2aims": (True, True),
        "airms": (True, True),
        "mit": (True, True),
        "moc": (True, True),
        "hazid": (True, True),
        "hazop": (True, True),
        "lopa": (True, True),
        "zona_indicator": (True, True),
        "zona_pse_list": (True, True),
        "location": (True, False),
    },
    "Project Manager": {
        "dashboard": (True, False),
        "project": (True, True),
        # Read-only: the Create/Edit Project form picks location from this lookup
        # instead of free-typed text, so Project Manager needs at least view access.
        "location": (True, False),
    },
    "HSSE & Admin": {
        "dashboard": (True, False),
        "hsse": (True, True),
        "lcv": (True, True),
    },
}

# A prior, coarser-grained scheme (4 roles / 5 broad menus: Produksi, OS, Project,
# HSSE, AKHLAK) was seeded ad hoc straight into the staging DB before this module
# existed. Detect it by role_name and migrate accounts across one time, by best
# semantic fit — re-check assignments afterwards via the User Management page.
LEGACY_ROLE_REMAP: dict[str, str] = {
    "Senior Manager": "Executive",
    "Manager Projects": "Project Manager",
    "Tim Admin": "HSSE & Admin",
    "Tim ITS": "Executive",
}


async def _insert_rbac_matrix(async_session: SQLAlchemyAsyncSession) -> tuple[dict[str, Role], dict[str, Menu]]:
    role_by_name: dict[str, Role] = {}
    for role_name in ROLES:
        role = Role(role_name=role_name)
        async_session.add(role)
        role_by_name[role_name] = role

    menu_by_name: dict[str, Menu] = {}
    for menu_name in MENUS:
        menu = Menu(menu_name=menu_name)
        async_session.add(menu)
        menu_by_name[menu_name] = menu

    await async_session.flush()  # assign ids

    for role_name, menus in ACCESS.items():
        for menu_name, (can_view, can_upload) in menus.items():
            async_session.add(
                RoleMenuAccess(
                    role_id=role_by_name[role_name].id,
                    menu_id=menu_by_name[menu_name].id,
                    can_view=can_view,
                    can_upload=can_upload,
                )
            )

    await async_session.flush()
    return role_by_name, menu_by_name


async def _migrate_legacy_rbac(async_session: SQLAlchemyAsyncSession, legacy_roles: list[Role]) -> None:
    old_role_name_by_id = {r.id: r.role_name for r in legacy_roles}

    accounts = (await async_session.execute(sqlalchemy.select(Account))).scalars().all()
    new_role_name_by_account_id: dict = {}
    for account in accounts:
        old_name = old_role_name_by_id.get(account.role_id)
        new_name = LEGACY_ROLE_REMAP.get(old_name) if old_name else None
        if new_name:
            new_role_name_by_account_id[account.id] = new_name

    # Clear FK references before wiping the old role/menu rows.
    await async_session.execute(sqlalchemy.update(Account).values(role_id=None))
    await async_session.execute(sqlalchemy.delete(RoleMenuAccess))
    await async_session.execute(sqlalchemy.delete(Menu))
    await async_session.execute(sqlalchemy.delete(Role))
    await async_session.flush()

    role_by_name, _ = await _insert_rbac_matrix(async_session)

    for account in accounts:
        new_role_name = new_role_name_by_account_id.get(account.id)
        if new_role_name:
            account.role_id = role_by_name[new_role_name].id

    await async_session.flush()
    loguru.logger.warning(
        "RBAC --- Migrated legacy role/menu scheme to the RENCANA PENGUJIAN 5-role matrix. "
        f"Remapped {len(new_role_name_by_account_id)} account(s) by best semantic fit — "
        "verify via the User Management admin page."
    )


async def seed_rbac_data(async_session: SQLAlchemyAsyncSession) -> None:
    """Idempotent: no-ops once the role table holds the current (or any other) scheme.

    Does not commit — caller owns the transaction (see events.py, which runs
    this inside the same `engine.begin()` block as `create_all`).
    """
    existing_roles = (await async_session.execute(sqlalchemy.select(Role))).scalars().all()

    legacy_roles = [r for r in existing_roles if r.role_name in LEGACY_ROLE_REMAP]
    if legacy_roles:
        await _migrate_legacy_rbac(async_session, legacy_roles)
        return

    if existing_roles:
        return

    await _insert_rbac_matrix(async_session)
