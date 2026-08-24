"""Error types shared by every connector."""


class NzSourceError(Exception):
    """Base error for the NZ data source adapters."""


class NzSourceApiError(NzSourceError):
    """A source answered with a non-success HTTP status or the request failed."""

    def __init__(self, source: str, message: str) -> None:
        self.source = source
        super().__init__(f"{source}: {message}")


class NzSourceParseError(NzSourceError):
    """A source returned a payload that did not match its expected shape."""

    def __init__(self, source: str, message: str) -> None:
        self.source = source
        super().__init__(f"{source}: {message}")


class StatsNzError(Exception):
    """Base error for the Aotearoa Data Explorer client."""


class StatsNzParseError(StatsNzError):
    """The ADE API returned a malformed response."""


class StatsNzApiError(StatsNzError):
    """The ADE API answered with a non-success status or the request failed."""

    def __init__(self, message: str, status: int, retryable: bool, url: str | None = None) -> None:
        self.status = status
        self.retryable = retryable
        self.url = url
        super().__init__(message)
