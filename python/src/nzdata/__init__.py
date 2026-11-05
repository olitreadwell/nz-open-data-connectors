"""Keyless-first connectors for NZ public data."""

from .errors import (
    NzSourceApiError,
    NzSourceError,
    NzSourceParseError,
    StatsNzApiError,
    StatsNzError,
    StatsNzParseError,
)
from .sources import (
    NZ_DATA_SOURCES,
    get_nz_data_source,
    iter_data_govt_nz_datasets,
    probe_all_nz_data_sources,
    probe_nz_data_source,
    search_all_data_govt_nz_datasets,
    search_data_govt_nz_datasets,
)
from .stats_nz import (
    StatsNzCodelist,
    StatsNzCodelistItem,
    StatsNzDataflow,
    StatsNzObservation,
    create_stats_nz_client,
    parse_sdmx_json_response,
    parse_stats_nz_csv,
    serialize_stats_nz_rows_to_csv,
)

__all__ = [
    "NZ_DATA_SOURCES",
    "NzSourceApiError",
    "NzSourceError",
    "NzSourceParseError",
    "StatsNzApiError",
    "StatsNzCodelist",
    "StatsNzCodelistItem",
    "StatsNzDataflow",
    "StatsNzError",
    "StatsNzObservation",
    "StatsNzParseError",
    "create_stats_nz_client",
    "get_nz_data_source",
    "iter_data_govt_nz_datasets",
    "parse_sdmx_json_response",
    "parse_stats_nz_csv",
    "probe_all_nz_data_sources",
    "probe_nz_data_source",
    "search_all_data_govt_nz_datasets",
    "search_data_govt_nz_datasets",
    "serialize_stats_nz_rows_to_csv",
]
