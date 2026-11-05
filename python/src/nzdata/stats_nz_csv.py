"""CSV value parsing for Stats NZ ADE payloads."""

import math
import re
from typing import Dict, List, Optional

from .errors import StatsNzParseError

_DECIMAL_NUMBER = re.compile(
    r"^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$"
)
_RADIX_NUMBER = re.compile(r"^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+)$")


def parse_observation_value(raw_value: str) -> Optional[float]:
    """Parses a value the way JavaScript's Number() does, then rejects non-finite results."""
    if raw_value == "":
        return None
    text = raw_value.strip()
    if text == "":
        value = 0.0
    elif _RADIX_NUMBER.fullmatch(text):
        try:
            value = float(int(text, 0))
        except (OverflowError, ValueError) as exc:
            raise StatsNzParseError(
                f"Invalid OBS_VALUE in Stats NZ CSV: {raw_value}"
            ) from exc
    elif _DECIMAL_NUMBER.fullmatch(text):
        value = float(text)
    else:
        raise StatsNzParseError(f"Invalid OBS_VALUE in Stats NZ CSV: {raw_value}")
    if not math.isfinite(value):
        raise StatsNzParseError(f"Invalid OBS_VALUE in Stats NZ CSV: {raw_value}")
    return value


def parse_csv_rows(text: str) -> List[Dict[str, str]]:
    """Parses CSV rows with the same lenient quote and newline rules as TypeScript."""
    normalized = text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.strip():
        return []

    rows: List[List[str]] = []
    row: List[str] = []
    field: List[str] = []
    in_quotes = False
    index = 0
    while index < len(normalized):
        char = normalized[index]
        if in_quotes:
            if char == '"':
                if index + 1 < len(normalized) and normalized[index + 1] == '"':
                    field.append('"')
                    index += 2
                    continue
                in_quotes = False
                index += 1
                continue
            field.append(char)
            index += 1
            continue
        if char == '"':
            in_quotes = True
            index += 1
            continue
        if char == ",":
            row.append("".join(field))
            field = []
            index += 1
            continue
        if char == "\n":
            row.append("".join(field))
            rows.append(row)
            row = []
            field = []
            index += 1
            continue
        field.append(char)
        index += 1

    if field or row:
        row.append("".join(field))
        rows.append(row)

    if not rows:
        return []
    header = rows[0]
    records: List[Dict[str, str]] = []
    for values in rows[1:]:
        if len(values) > len(header):
            raise StatsNzParseError("CSV row has more fields than the header row")
        records.append(
            {
                name: values[index] if index < len(values) else ""
                for index, name in enumerate(header)
            }
        )
    return records
