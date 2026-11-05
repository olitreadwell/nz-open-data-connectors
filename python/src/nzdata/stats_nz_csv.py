"""CSV value parsing for Stats NZ ADE payloads."""

import csv
import io
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
        value = float(int(text, 0))
    elif _DECIMAL_NUMBER.fullmatch(text):
        value = float(text)
    else:
        raise StatsNzParseError(f"Invalid OBS_VALUE in Stats NZ CSV: {raw_value}")
    if not math.isfinite(value):
        raise StatsNzParseError(f"Invalid OBS_VALUE in Stats NZ CSV: {raw_value}")
    return value


def parse_csv_rows(text: str) -> List[Dict[str, str]]:
    """Parses CSV rows, matching the TypeScript parser's blank-row and width rules."""
    try:
        rows = list(csv.reader(io.StringIO(text)))
    except csv.Error as exc:
        raise StatsNzParseError(f"Malformed Stats NZ CSV: {exc}") from exc
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
