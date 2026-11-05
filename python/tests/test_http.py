"""Unit tests for the Python port's shared redirect handling."""

import nzdata.http as http


class StubResponse:
    def __init__(self, status_code, location=None):
        self.status_code = status_code
        self.headers = {} if location is None else {"location": location}


def test_cross_origin_redirect_drops_credentials(monkeypatch):
    calls = []

    def fake_get(url, headers, **kwargs):
        calls.append((url, dict(headers)))
        if len(calls) == 1:
            return StubResponse(302, "https://other.example/final")
        return StubResponse(200)

    monkeypatch.setattr(http.httpx, "get", fake_get)
    http.get_with_redirects(
        "https://api.example/start",
        {
            "user-agent": "nz-open-data-connectors",
            "Ocp-Apim-Subscription-Key": "secret",
            "X-Api-Key": "key",
        },
        1000,
    )

    assert calls[1][1] == {"user-agent": "nz-open-data-connectors"}


def test_same_origin_redirect_keeps_credentials(monkeypatch):
    calls = []

    def fake_get(url, headers, **kwargs):
        calls.append((url, dict(headers)))
        if len(calls) == 1:
            return StubResponse(302, "/final")
        return StubResponse(200)

    monkeypatch.setattr(http.httpx, "get", fake_get)
    http.get_with_redirects(
        "https://api.example/start",
        {"Ocp-Apim-Subscription-Key": "secret"},
        1000,
    )

    assert calls[1][1] == {"Ocp-Apim-Subscription-Key": "secret"}


def test_redirect_limit_returns_the_last_response(monkeypatch):
    calls = 0

    def fake_get(url, headers, **kwargs):
        nonlocal calls
        calls += 1
        return StubResponse(302, "/again")

    monkeypatch.setattr(http.httpx, "get", fake_get)
    response = http.get_with_redirects("https://api.example/start", {}, 1000, max_redirects=2)

    assert response.status_code == 302
    assert calls == 3
