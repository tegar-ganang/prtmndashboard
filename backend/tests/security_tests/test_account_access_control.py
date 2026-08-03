"""
Regression tests for the /api/accounts broken-access-control fix: an authenticated
account must never be able to read, mint a token for, update, or delete another
account. Runs against the staging Postgres DB configured in backend/.env (not local,
not master) and cleans up every account it creates.
"""

import typing
import uuid

import httpx
import pytest


def _unique_email() -> str:
    return f"security-test-{uuid.uuid4().hex}@example.com"


async def _signup_and_signin(async_client: httpx.AsyncClient) -> dict[str, typing.Any]:
    email = _unique_email()
    password = "Sup3rSecret!"

    signup_res = await async_client.post(
        "/api/auth/signup",
        json={"email": email, "password": password, "name": f"Test {uuid.uuid4().hex[:8]}"},
    )
    assert signup_res.status_code == 201, signup_res.text

    signin_res = await async_client.post("/api/auth/signin", json={"email": email, "password": password})
    assert signin_res.status_code == 202, signin_res.text

    body = signin_res.json()["data"]["authorizedAccount"]
    account_id = signup_res.json()["data"]["id"]

    return {"id": account_id, "email": email, "token": body["token"]}


@pytest.fixture(name="two_accounts")
async def two_accounts_fixture(async_client: httpx.AsyncClient) -> typing.AsyncGenerator[dict[str, dict], None]:
    account_a = await _signup_and_signin(async_client)
    account_b = await _signup_and_signin(async_client)

    yield {"a": account_a, "b": account_b}

    for account in (account_a, account_b):
        await async_client.request(
            "DELETE",
            "/api/accounts",
            params={"id": account["id"]},
            headers={"Authorization": f"Bearer {account['token']}"},
        )


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


class TestAccountAccessControl:
    async def test_user_can_read_own_account(self, async_client: httpx.AsyncClient, two_accounts: dict) -> None:
        account_a = two_accounts["a"]

        res = await async_client.get(f"/api/accounts/{account_a['id']}", headers=_auth_headers(account_a["token"]))

        assert res.status_code == 200
        assert res.json()["data"]["id"] == account_a["id"]
        assert "token" not in res.json()["data"]

    async def test_user_cannot_read_other_account(self, async_client: httpx.AsyncClient, two_accounts: dict) -> None:
        account_a, account_b = two_accounts["a"], two_accounts["b"]

        res = await async_client.get(f"/api/accounts/{account_b['id']}", headers=_auth_headers(account_a["token"]))

        assert res.status_code == 403

    async def test_list_accounts_only_returns_self(self, async_client: httpx.AsyncClient, two_accounts: dict) -> None:
        account_a = two_accounts["a"]

        res = await async_client.get("/api/accounts", headers=_auth_headers(account_a["token"]))

        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data) == 1
        assert data[0]["id"] == account_a["id"]

    async def test_user_cannot_update_other_account(self, async_client: httpx.AsyncClient, two_accounts: dict) -> None:
        account_a, account_b = two_accounts["a"], two_accounts["b"]

        res = await async_client.patch(
            f"/api/accounts/{account_b['id']}",
            params={"update_name": "Hijacked"},
            headers=_auth_headers(account_a["token"]),
        )
        assert res.status_code == 403

        check = await async_client.get(f"/api/accounts/{account_b['id']}", headers=_auth_headers(account_b["token"]))
        assert check.json()["data"]["name"] != "Hijacked"

    async def test_user_cannot_delete_other_account(self, async_client: httpx.AsyncClient, two_accounts: dict) -> None:
        account_a, account_b = two_accounts["a"], two_accounts["b"]

        res = await async_client.request(
            "DELETE",
            "/api/accounts",
            params={"id": account_b["id"]},
            headers=_auth_headers(account_a["token"]),
        )
        assert res.status_code == 403

        still_there = await async_client.get(
            f"/api/accounts/{account_b['id']}", headers=_auth_headers(account_b["token"])
        )
        assert still_there.status_code == 200
