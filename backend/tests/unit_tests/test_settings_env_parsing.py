from src.config.settings.base import BackendBaseSettings

parse = BackendBaseSettings.Config.parse_env_var


def test_comma_separated_list_env_vars() -> None:
    # Plain comma strings, not JSON — pydantic v1 would json.loads these otherwise.
    assert parse("ADMIN_EMAILS", "A@x.com, b@y.com") == ["a@x.com", "b@y.com"]
    assert parse("BACKEND_CORS_ORIGINS", "http://a,http://b") == ["http://a", "http://b"]
    assert parse("ADMIN_EMAILS", "") == []
    # Everything else keeps pydantic's JSON behaviour.
    assert parse("SOME_OTHER_LIST", '["a"]') == ["a"]
