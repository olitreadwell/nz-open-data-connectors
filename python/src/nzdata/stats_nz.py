"""Client for the Aotearoa Data Explorer (ADE) API.

SDMX 2.1 REST, base URL https://api.data.stats.govt.nz/rest/. Server-side
only: SDMX responses can be large, so never call this from a browser.
"""

from __future__ import annotations

import json
import math
import urllib.parse
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

import httpx

from .errors import StatsNzApiError, StatsNzError, StatsNzParseError
from .http import get_with_redirects
from .stats_nz_csv import parse_csv_rows, parse_observation_value

DEFAULT_BASE_URL = "https://api.data.stats.govt.nz/rest"
DEFAULT_VERSION = "1.0"
DEFAULT_TIMEOUT_MS = 30_000
USER_AGENT = "nz-open-data-connectors (Language=Python)"
VALID_FORMATS = ("csv", "csvfilewithlabels", "jsondata")

FetchResult = Tuple[int, str]
FetchImpl = Callable[[str, Dict[str, str], int], FetchResult]


@dataclass
class StatsNzDataflow:
    """One table in the ADE catalogue."""

    id: str
    agency_id: str
    version: str
    title: str


@dataclass
class StatsNzObservation:
    """One row of data: dimension codes plus a value."""

    dimensions: Dict[str, str]
    value: Optional[float]
    labels: Optional[Dict[str, str]] = None
    status: Optional[str] = None


@dataclass
class StatsNzCodelistItem:
    """One dimension code mapped to a human label."""

    id: str
    name: str


@dataclass
class StatsNzCodelist:
    """A dimension codelist: codes to labels."""

    id: str
    agency_id: str
    version: str
    items: List[StatsNzCodelistItem]


def _default_fetch(url: str, headers: Dict[str, str], timeout_ms: int) -> FetchResult:
    try:
        response = get_with_redirects(url, headers, timeout_ms)
        return response.status_code, response.text
    except httpx.HTTPError as exc:
        raise StatsNzApiError(
            f"Stats NZ request failed: {exc}", status=0, retryable=True, url=url
        ) from exc


def parse_stats_nz_csv(text: str, dataflow_id: str) -> List[StatsNzObservation]:
    """Parses an ADE CSV payload (codes only) into typed observations."""
    text = text.lstrip("\ufeff")
    if not text.strip():
        return []
    records = parse_csv_rows(text)
    if not records:
        return []
    if "OBS_VALUE" not in records[0]:
        raise StatsNzParseError("Stats NZ CSV is missing the OBS_VALUE column")
    suffix = f"_{dataflow_id}"
    label_suffix = f"_LABEL{suffix}"
    observations: List[StatsNzObservation] = []
    for record in records:
        dimensions: Dict[str, str] = {}
        labels: Dict[str, str] = {}
        for key, cell_value in record.items():
            if key in ("DATAFLOW", "OBS_VALUE", "OBS_STATUS"):
                continue
            if key.endswith(label_suffix):
                labels[key[: -len(label_suffix)]] = cell_value or ""
                continue
            if key.endswith(suffix):
                dimensions[key[: -len(suffix)]] = cell_value or ""
        value = parse_observation_value(record.get("OBS_VALUE", ""))
        status = (record.get("OBS_STATUS") or "").strip()
        observation = StatsNzObservation(dimensions=dimensions, value=value)
        if labels:
            observation.labels = labels
        if status:
            observation.status = status
        observations.append(observation)
    return observations


def _sdmx_values(values: Any, dimension: str) -> List[Dict[str, str]]:
    if not isinstance(values, list):
        raise StatsNzParseError(
            f"Stats NZ jsondata dimension {dimension} has no values list"
        )
    result: List[Dict[str, str]] = []
    for value in values:
        if (
            not isinstance(value, dict)
            or not isinstance(value.get("id"), str)
            or not isinstance(value.get("name"), str)
        ):
            raise StatsNzParseError(
                f"Stats NZ jsondata dimension {dimension} has an invalid value"
            )
        result.append({"id": value["id"], "name": value["name"]})
    return result


def _sdmx_dimensions(value: Any, label: str) -> List[Tuple[str, List[Dict[str, str]]]]:
    if not isinstance(value, list):
        raise StatsNzParseError(f"Stats NZ jsondata has no {label} dimensions list")
    dimensions: List[Tuple[str, List[Dict[str, str]]]] = []
    for dimension in value:
        if not isinstance(dimension, dict) or not isinstance(dimension.get("id"), str):
            raise StatsNzParseError(f"Stats NZ jsondata has an invalid {label} dimension")
        dimensions.append(
            (dimension["id"], _sdmx_values(dimension.get("values"), dimension["id"]))
        )
    return dimensions


def _reject_json_constant(value: str) -> None:
    raise ValueError(f"invalid JSON constant: {value}")


def _sdmx_index(value: Any) -> Optional[int]:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value >= 0 else None
    if isinstance(value, float) and math.isfinite(value) and value.is_integer():
        return int(value) if value >= 0 else None
    if isinstance(value, str):
        try:
            number = float(value)
        except ValueError:
            return None
        if math.isfinite(number) and number.is_integer() and number >= 0:
            return int(number)
    return None


def _finite_number(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    try:
        return math.isfinite(float(value))
    except (OverflowError, ValueError):
        return False


def _sdmx_observation_value(observation: Any) -> Optional[float]:
    if not isinstance(observation, list):
        raise StatsNzParseError("Stats NZ jsondata response does not match the SDMX-JSON shape")
    for entry in observation:
        if entry is None:
            continue
        if isinstance(entry, list):
            if not all(_finite_number(item) for item in entry):
                raise StatsNzParseError(
                    "Stats NZ jsondata response does not match the SDMX-JSON shape"
                )
            continue
        if not _finite_number(entry):
            raise StatsNzParseError(
                "Stats NZ jsondata response does not match the SDMX-JSON shape"
            )
    if not observation:
        return None
    first = observation[0]
    return float(first) if _finite_number(first) else None


def parse_sdmx_json_response(text: str) -> List[StatsNzObservation]:
    """Parses a Stats NZ jsondata response into observations."""
    try:
        payload = json.loads(text, parse_constant=_reject_json_constant)
    except (json.JSONDecodeError, ValueError) as exc:
        raise StatsNzParseError("Stats NZ jsondata response is not valid JSON") from exc
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        raise StatsNzParseError("Stats NZ jsondata response does not match the SDMX-JSON shape")
    datasets = data.get("dataSets", [])
    structure = data.get("structure")
    if not isinstance(datasets, list) or not isinstance(structure, dict):
        raise StatsNzParseError("Stats NZ jsondata response does not match the SDMX-JSON shape")
    dimensions = structure.get("dimensions")
    if not isinstance(dimensions, dict):
        raise StatsNzParseError("Stats NZ jsondata response does not match the SDMX-JSON shape")
    series_dimensions = _sdmx_dimensions(dimensions.get("series"), "series")
    observation_dimensions = _sdmx_dimensions(dimensions.get("observation", []), "observation")
    time_dimension = next(
        (entry for entry in observation_dimensions if entry[0] == "TIME_PERIOD"),
        observation_dimensions[0] if observation_dimensions else None,
    )
    attributes = structure.get("attributes", {})
    if not isinstance(attributes, dict):
        raise StatsNzParseError("Stats NZ jsondata response does not match the SDMX-JSON shape")
    observation_attributes = attributes.get("observation", [])
    if not isinstance(observation_attributes, list):
        raise StatsNzParseError("Stats NZ jsondata response does not match the SDMX-JSON shape")
    status_values: Optional[List[Dict[str, str]]] = None
    for attribute in observation_attributes:
        if isinstance(attribute, dict) and attribute.get("id") == "OBS_STATUS":
            status_values = _sdmx_values(attribute.get("values"), "OBS_STATUS")
            break

    rows: List[StatsNzObservation] = []
    for dataset in datasets:
        if not isinstance(dataset, dict) or not isinstance(dataset.get("series"), dict):
            raise StatsNzParseError(
                "Stats NZ jsondata response does not match the SDMX-JSON shape"
            )
        for series_key, series in dataset["series"].items():
            if not isinstance(series, dict) or not isinstance(series.get("observations"), dict):
                raise StatsNzParseError(
                    "Stats NZ jsondata response does not match the SDMX-JSON shape"
                )
            row_dimensions: Dict[str, str] = {}
            labels: Dict[str, str] = {}
            parts = series_key.split(":")
            for index, (dimension_id, values) in enumerate(series_dimensions):
                position = _sdmx_index(parts[index]) if index < len(parts) else None
                if position is None:
                    continue
                if 0 <= position < len(values):
                    row_dimensions[dimension_id] = values[position]["id"]
                    labels[dimension_id] = values[position]["name"]

            for observation_key, observation in series["observations"].items():
                row_dimensions = dict(row_dimensions)
                row_labels = dict(labels)
                if time_dimension is not None:
                    time_index = _sdmx_index(observation_key.split(":")[0])
                    if time_index is not None and 0 <= time_index < len(time_dimension[1]):
                        period = time_dimension[1][time_index]
                        row_dimensions["TIME_PERIOD"] = period["id"]
                        row_labels["TIME_PERIOD"] = period["name"]
                value = _sdmx_observation_value(observation)
                row = StatsNzObservation(dimensions=row_dimensions, value=value)
                row.labels = row_labels
                if (
                    len(observation) > 1
                    and isinstance(observation[1], list)
                    and observation[1]
                    and status_values is not None
                ):
                    status_index = _sdmx_index(observation[1][0])
                    if status_index is not None and 0 <= status_index < len(status_values):
                        status = status_values[status_index]["id"]
                        if status != "":
                            row.status = status
                rows.append(row)
    return rows


def _format_value(value: Optional[float]) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _escape_csv_cell(value: str) -> str:
    if "," in value or '"' in value or "\n" in value:
        return f'"{value.replace(chr(34), chr(34) * 2)}"'
    return value


def serialize_stats_nz_rows_to_csv(rows: List[StatsNzObservation]) -> str:
    """Serializes typed observations back to CSV (dimensions, value, status)."""
    if not rows:
        return ""
    dimension_keys = sorted({key for row in rows for key in row.dimensions})
    has_status = any(row.status is not None for row in rows)
    header = dimension_keys + ["value"] + (["status"] if has_status else [])
    lines = [",".join(header)]
    for row in rows:
        cells = [row.dimensions.get(key, "") for key in dimension_keys]
        cells.append(_format_value(row.value))
        if has_status:
            cells.append(row.status or "")
        lines.append(",".join(_escape_csv_cell(cell) for cell in cells))
    return "\n".join(lines)


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _as_record(value: Any) -> Optional[Dict[str, Any]]:
    return value if isinstance(value, dict) else None


def _as_string(value: Any) -> str:
    return value if isinstance(value, str) else ""


def _simplify(element: ET.Element) -> Dict[str, Any]:
    """Converts an ElementTree element into plain dicts keyed by local names."""
    result: Dict[str, Any] = {}
    for key, value in element.attrib.items():
        result[f"@_{_local_name(key)}"] = value
    children = list(element)
    if not children:
        if element.text and element.text.strip():
            result["#text"] = element.text.strip()
        return result
    for child in children:
        name = _local_name(child.tag)
        child_value = _simplify(child)
        if name in result:
            if not isinstance(result[name], list):
                result[name] = [result[name]]
            result[name].append(child_value)
        else:
            result[name] = child_value
    return result


def parse_dataflow_catalogue_xml(xml: str) -> List[StatsNzDataflow]:
    """Parses the ADE dataflow catalogue XML into dataflow records."""
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as exc:
        raise StatsNzParseError("Failed to parse Stats NZ dataflow catalogue XML") from exc
    doc = {_local_name(root.tag): _simplify(root)}
    structure = _as_record((_as_record(doc) or {}).get("Structure"))
    if structure is None:
        raise StatsNzParseError("Stats NZ dataflow catalogue XML has no Structure element")
    structures = _as_record(structure.get("Structures"))
    dataflows_node = _as_record(structures.get("Dataflows")) if structures else None
    dataflows_value = dataflows_node.get("Dataflow") if dataflows_node else None
    dataflows = (
        dataflows_value
        if isinstance(dataflows_value, list)
        else [dataflows_value]
        if dataflows_value is not None
        else []
    )
    return [
        StatsNzDataflow(
            id=_as_string((_as_record(flow) or {}).get("@_id")),
            agency_id=_as_string((_as_record(flow) or {}).get("@_agencyID")),
            version=_as_string((_as_record(flow) or {}).get("@_version")),
            title=_as_string((_as_record((_as_record(flow) or {}).get("Name")) or {}).get("#text")),
        )
        for flow in dataflows
    ]


def _to_codelist_items(codes_value: Any) -> List[StatsNzCodelistItem]:
    codes = (
        codes_value
        if isinstance(codes_value, list)
        else [codes_value]
        if codes_value is not None
        else []
    )
    return [
        StatsNzCodelistItem(
            id=_as_string((_as_record(code) or {}).get("@_id")),
            name=_as_string((_as_record((_as_record(code) or {}).get("Name")) or {}).get("#text")),
        )
        for code in codes
    ]


def parse_codelist_xml(xml: str) -> StatsNzCodelist:
    """Parses an ADE codelist XML payload into a codelist."""
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as exc:
        raise StatsNzParseError("Failed to parse Stats NZ codelist XML") from exc
    doc = {_local_name(root.tag): _simplify(root)}
    structure = _as_record((_as_record(doc) or {}).get("Structure"))
    structures = _as_record(structure.get("Structures")) if structure else None
    codelists = _as_record(structures.get("Codelists")) if structures else None
    codelists_value = codelists.get("Codelist") if codelists else None
    codelist_list = (
        codelists_value
        if isinstance(codelists_value, list)
        else [codelists_value]
        if codelists_value is not None
        else []
    )
    codelist = _as_record(codelist_list[0]) if codelist_list else None
    if codelist is None:
        raise StatsNzParseError("Stats NZ codelist XML has no Codelist element")
    return StatsNzCodelist(
        id=_as_string(codelist.get("@_id")),
        agency_id=_as_string(codelist.get("@_agencyID")),
        version=_as_string(codelist.get("@_version")),
        items=_to_codelist_items(codelist.get("Code")),
    )


class StatsNzClient:
    """Typed client for the Aotearoa Data Explorer API."""

    def __init__(
        self,
        subscription_key: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout_ms: int = DEFAULT_TIMEOUT_MS,
        fetch_impl: Optional[FetchImpl] = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._subscription_key = subscription_key
        self._timeout_ms = timeout_ms
        self._fetch = fetch_impl or _default_fetch

    def _send_request(self, path: str, accept: str) -> str:
        url = f"{self._base_url}{path}"
        headers: Dict[str, str] = {
            "Accept": accept,
            "Cache-Control": "no-cache",
            "user-agent": USER_AGENT,
        }
        if self._subscription_key is not None:
            headers["Ocp-Apim-Subscription-Key"] = self._subscription_key
        status, body = self._fetch(url, headers, self._timeout_ms)
        if status < 200 or status >= 300:
            message = f"Stats NZ API request failed with status {status}"
            try:
                parsed = json.loads(body)
                if isinstance(parsed, dict) and isinstance(parsed.get("message"), str):
                    message = parsed["message"]
            except json.JSONDecodeError:
                pass
            raise StatsNzApiError(
                message, status=status, retryable=status == 429 or status >= 500, url=url
            )
        return body

    def get_data(
        self,
        dataflow_id: str,
        key: str = "all",
        version: Optional[str] = None,
        format: str = "csv",
    ) -> List[StatsNzObservation]:
        """Pulls data rows for a dataflow. Keyless for AGR_* tables."""
        if format not in VALID_FORMATS:
            raise StatsNzError(f"Unsupported Stats NZ response format: {format}")
        version = version or DEFAULT_VERSION
        path = (
            f"/data/STATSNZ,{urllib.parse.quote(dataflow_id)},{urllib.parse.quote(version)}"
            f"/{urllib.parse.quote(key)}?format={format}"
        )
        accept = "application/json" if format == "jsondata" else "text/csv"
        body = self._send_request(path, accept)
        if format == "jsondata":
            return parse_sdmx_json_response(body)
        return parse_stats_nz_csv(body, dataflow_id)

    def get_dataflow_catalogue(self) -> List[StatsNzDataflow]:
        """Lists every dataflow in the ADE catalogue. Keyless."""
        body = self._send_request("/dataflow/STATSNZ/all", "application/xml")
        return parse_dataflow_catalogue_xml(body)

    def get_codelist(
        self, codelist_id: str, version: Optional[str] = None
    ) -> StatsNzCodelist:
        """Resolves dimension codes to labels. Needs a subscription key."""
        version_segment = "" if version is None else f"/{urllib.parse.quote(version)}"
        path = f"/codelist/STATSNZ/{urllib.parse.quote(codelist_id)}{version_segment}"
        body = self._send_request(path, "application/xml")
        return parse_codelist_xml(body)


def create_stats_nz_client(
    subscription_key: Optional[str] = None,
    base_url: str = DEFAULT_BASE_URL,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
    fetch_impl: Optional[FetchImpl] = None,
) -> StatsNzClient:
    """Builds a Stats NZ client. Keys are read from the caller, never the network."""
    return StatsNzClient(
        subscription_key=subscription_key,
        base_url=base_url,
        timeout_ms=timeout_ms,
        fetch_impl=fetch_impl,
    )
