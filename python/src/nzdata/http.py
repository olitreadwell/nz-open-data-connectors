"""Shared HTTP helpers for the Python port."""

from __future__ import annotations

from typing import Dict, Mapping
from urllib.parse import urljoin, urlsplit

import httpx

MAX_REDIRECTS = 5

_SENSITIVE_HEADERS = {
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "host",
}
_SENSITIVE_HEADER_PARTS = (
    "api-key",
    "apikey",
    "subscription-key",
    "access-token",
    "auth-token",
    "secret",
    "token",
)


def is_sensitive_header(name: str) -> bool:
    """Returns whether a request header must not cross origins on a redirect."""
    lowered = name.lower()
    return lowered in _SENSITIVE_HEADERS or any(
        part in lowered for part in _SENSITIVE_HEADER_PARTS
    )


def strip_sensitive_headers(headers: Mapping[str, str]) -> Dict[str, str]:
    """Drops credentials and other sensitive headers."""
    return {name: value for name, value in headers.items() if not is_sensitive_header(name)}


def _origin(url: str) -> tuple[str, str | None, int | None]:
    parsed = urlsplit(url)
    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme.lower() == "https" else 80
    return parsed.scheme.lower(), parsed.hostname.lower() if parsed.hostname else None, port


def same_origin(left: str, right: str) -> bool:
    """Returns whether two URLs share a scheme, host, and port."""
    return _origin(left) == _origin(right)


def get_with_redirects(
    url: str,
    headers: Mapping[str, str],
    timeout_ms: int,
    max_redirects: int = MAX_REDIRECTS,
) -> httpx.Response:
    """GETs a URL, following redirects without leaking credentials cross-origin."""
    current_url = url
    current_headers = dict(headers)
    response: httpx.Response | None = None
    for _ in range(max_redirects + 1):
        response = httpx.get(
            current_url,
            headers=current_headers,
            timeout=timeout_ms / 1000,
            follow_redirects=False,
        )
        location = response.headers.get("location")
        if response.status_code not in (301, 302, 303, 307, 308) or location is None:
            return response
        next_url = urljoin(current_url, location)
        if not same_origin(current_url, next_url):
            current_headers = strip_sensitive_headers(current_headers)
        current_url = next_url
    assert response is not None
    return response
