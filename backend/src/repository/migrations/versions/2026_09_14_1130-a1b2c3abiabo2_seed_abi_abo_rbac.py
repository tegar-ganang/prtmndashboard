"""seed_abi_abo_rbac_menus

Revision ID: a1b2c3abiabo2
Revises: a1b2c3abiabo1
Create Date: 2026-09-14 11:30:00.000000

seed_rbac_data() is idempotent and only inserts the full role/menu matrix
once (when the role table is empty) — it won't add new menus to an
already-seeded DB. Since abi/abo were added to MENUS/ACCESS in
seed_rbac.py after this DB was first seeded, insert them explicitly here:
Executive gets view-only (matches every other menu for that role),
OSF Engineer gets full edit (matches the rest of its OSF module access).
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3abiabo2"
down_revision = "a1b2c3abiabo1"
branch_labels = None
depends_on = None

_MENUS = ["abi", "abo"]
_ROLE_ACCESS = {
    "Executive": (True, False),
    "OSF Engineer": (True, True),
}


def upgrade() -> None:
    conn = op.get_bind()

    for menu_name in _MENUS:
        existing = conn.execute(
            sa.text("SELECT id FROM app.menu WHERE menu_name = :name"), {"name": menu_name}
        ).fetchone()
        if existing:
            menu_id = existing[0]
        else:
            conn.execute(sa.text("INSERT INTO app.menu (menu_name) VALUES (:name)"), {"name": menu_name})
            menu_id = conn.execute(
                sa.text("SELECT id FROM app.menu WHERE menu_name = :name"), {"name": menu_name}
            ).fetchone()[0]

        for role_name, (can_view, can_upload) in _ROLE_ACCESS.items():
            role = conn.execute(
                sa.text("SELECT id FROM app.role WHERE role_name = :name"), {"name": role_name}
            ).fetchone()
            if not role:
                continue  # role doesn't exist in this environment yet — nothing to grant
            role_id = role[0]

            access_exists = conn.execute(
                sa.text("SELECT 1 FROM app.role_menu_access WHERE role_id = :rid AND menu_id = :mid"),
                {"rid": role_id, "mid": menu_id},
            ).fetchone()
            if not access_exists:
                conn.execute(
                    sa.text("""
                        INSERT INTO app.role_menu_access (role_id, menu_id, can_view, can_upload)
                        VALUES (:rid, :mid, :view, :upload)
                    """),
                    {"rid": role_id, "mid": menu_id, "view": can_view, "upload": can_upload},
                )


def downgrade() -> None:
    conn = op.get_bind()
    for menu_name in _MENUS:
        menu = conn.execute(
            sa.text("SELECT id FROM app.menu WHERE menu_name = :name"), {"name": menu_name}
        ).fetchone()
        if menu:
            conn.execute(sa.text("DELETE FROM app.role_menu_access WHERE menu_id = :mid"), {"mid": menu[0]})
            conn.execute(sa.text("DELETE FROM app.menu WHERE id = :mid"), {"mid": menu[0]})
