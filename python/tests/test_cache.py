"""Unit tests for the optional JSON response cache."""

import pytest

import nzdata.sources as sources
from nzdata.errors import NzSourceApiError


def test_json_cache_avoids_a_second_request(tmp_path, monkeypatch):
    calls = []

    def fake_text(url, headers=None):
        calls.append(url)
        return '{"ok": true, "value": 1}'

    monkeypatch.setattr(sources, "_get_text", fake_text)
    monkeypatch.setenv("NZDATA_CACHE_DIR", str(tmp_path))

    first = sources._get_json("https://example.test/data.json")
    second = sources._get_json("https://example.test/data.json")

    assert first == second == {"ok": True, "value": 1}
    assert calls == ["https://example.test/data.json"]


def test_offline_mode_requires_a_cached_response(tmp_path, monkeypatch):
    monkeypatch.setenv("NZDATA_CACHE_DIR", str(tmp_path))
    monkeypatch.setenv("NZDATA_OFFLINE", "1")

    with pytest.raises(NzSourceApiError, match="offline"):
        sources._get_json("https://example.test/missing.json")


def test_cache_key_changes_with_headers():
    left = sources._cache_key("https://example.test/data.json", {"key": "a"})
    right = sources._cache_key("https://example.test/data.json", {"key": "b"})

    assert left != right
