"""Unit tests for the Stats NZ client. Fixtures and a stub fetch, no network."""

import csv
import io
import json
from importlib.resources import files

import pytest

from nzdata.errors import StatsNzApiError, StatsNzError, StatsNzParseError
from nzdata.stats_nz import (
    create_stats_nz_client,
    parse_codelist_xml,
    parse_dataflow_catalogue_xml,
    parse_stats_nz_csv,
    serialize_stats_nz_rows_to_csv,
)


def read_fixture_text(filename):
    return files("nzdata").joinpath("fixtures", filename).read_text()


LIVESTOCK_CSV = read_fixture_text("agricultural-livestock-regional-council-2025-08-17.csv")
CATALOGUE_XML = read_fixture_text("dataflow-catalogue-subset.xml")


def test_parse_stats_nz_csv_reads_dimensions_and_values():
    rows = parse_stats_nz_csv(LIVESTOCK_CSV, "AGR_AGR_003")
    assert len(rows) > 0
    first = rows[0]
    assert first.dimensions == {"LIVESTOCK": "6731", "AREA": "8", "YEAR": "1994"}
    assert first.value == 7458218
    assert first.status is None


def test_parse_stats_nz_csv_rejects_missing_value_column():
    with pytest.raises(StatsNzParseError):
        parse_stats_nz_csv("a,b\n1,2\n", "AGR_AGR_003")


def test_parse_stats_nz_csv_rejects_non_finite_value():
    with pytest.raises(StatsNzParseError):
        parse_stats_nz_csv("OBS_VALUE_AGR_AGR_003\nnot-a-number\n", "AGR_AGR_003")


def test_serialize_round_trips_through_csv_module():
    rows = parse_stats_nz_csv(LIVESTOCK_CSV, "AGR_AGR_003")[:3]
    text = serialize_stats_nz_rows_to_csv(rows)
    records = list(csv.DictReader(io.StringIO(text)))
    assert len(records) == 3
    assert records[0]["LIVESTOCK"] == "6731"
    assert records[0]["value"] == "7458218"


def test_serialize_empty_rows():
    assert serialize_stats_nz_rows_to_csv([]) == ""


def test_serialize_escapes_commas_and_quotes():
    from nzdata.stats_nz import StatsNzObservation

    rows = [StatsNzObservation(dimensions={"AREA": 'a,b "c"'}, value=1)]
    assert serialize_stats_nz_rows_to_csv(rows) == 'AREA,value\n"a,b ""c""",1'


def test_parse_dataflow_catalogue_xml():
    dataflows = parse_dataflow_catalogue_xml(CATALOGUE_XML)
    assert len(dataflows) > 0
    first = dataflows[0]
    assert first.id == "AGR_AGR_001"
    assert first.agency_id == "STATSNZ"
    assert first.version == "1.0"
    assert first.title == "Forestry by Regional Council"


def test_parse_dataflow_catalogue_xml_rejects_missing_structure():
    with pytest.raises(StatsNzParseError):
        parse_dataflow_catalogue_xml("<xml></xml>")


def test_parse_codelist_xml():
    xml = """<?xml version="1.0"?>
    <message:Structure xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message"
      xmlns:structure="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure"
      xmlns:common="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common">
      <message:Structures>
        <structure:Codelists>
          <structure:Codelist id="CL_YEAR" agencyID="STATSNZ" version="1.0">
            <structure:Code id="2024">
              <common:Name xml:lang="en">Year ended June 2024</common:Name>
            </structure:Code>
          </structure:Codelist>
        </structure:Codelists>
      </message:Structures>
    </message:Structure>"""
    codelist = parse_codelist_xml(xml)
    assert codelist.id == "CL_YEAR"
    assert codelist.agency_id == "STATSNZ"
    assert codelist.items[0].id == "2024"
    assert codelist.items[0].name == "Year ended June 2024"


def test_parse_codelist_xml_rejects_missing_codelist():
    with pytest.raises(StatsNzParseError):
        parse_codelist_xml("<Structure></Structure>")


def make_stub_fetch(responses):
    def fetch_impl(url, headers, timeout_ms):
        for expected_url, status, body in responses:
            if url == expected_url:
                return status, body
        raise AssertionError(f"unexpected URL: {url}")

    return fetch_impl


def test_client_get_data_builds_url_and_parses():
    client = create_stats_nz_client(
        fetch_impl=make_stub_fetch(
            [
                (
                    "https://api.data.stats.govt.nz/rest/data/STATSNZ,AGR_AGR_003,1.0/all?format=csv",
                    200,
                    LIVESTOCK_CSV,
                )
            ]
        )
    )
    rows = client.get_data("AGR_AGR_003")
    assert len(rows) > 0
    assert rows[0].value == 7458218


def test_client_get_data_sends_subscription_key_header():
    seen_headers = {}

    def fetch_impl(url, headers, timeout_ms):
        seen_headers.update(headers)
        return 200, LIVESTOCK_CSV

    client = create_stats_nz_client(subscription_key="secret", fetch_impl=fetch_impl)
    client.get_data("AGR_AGR_003")
    assert seen_headers["Ocp-Apim-Subscription-Key"] == "secret"


def test_client_get_data_raises_api_error_with_retryable_flag():
    client = create_stats_nz_client(fetch_impl=lambda _u, _h, _t: (500, "boom"))
    with pytest.raises(StatsNzApiError) as exc_info:
        client.get_data("AGR_AGR_003")
    assert exc_info.value.status == 500
    assert exc_info.value.retryable is True


def test_client_get_data_raises_on_429():
    client = create_stats_nz_client(fetch_impl=lambda _u, _h, _t: (429, "slow down"))
    with pytest.raises(StatsNzApiError) as exc_info:
        client.get_data("AGR_AGR_003")
    assert exc_info.value.retryable is True


def test_client_get_data_rejects_unknown_format():
    client = create_stats_nz_client(fetch_impl=lambda _u, _h, _t: (200, ""))
    with pytest.raises(StatsNzError):
        client.get_data("AGR_AGR_003", format="xml")


def test_client_get_data_rejects_jsondata_in_python_port():
    client = create_stats_nz_client(fetch_impl=lambda _u, _h, _t: (200, ""))
    with pytest.raises(StatsNzError):
        client.get_data("AGR_AGR_003", format="jsondata")


def test_client_get_dataflow_catalogue():
    client = create_stats_nz_client(
        fetch_impl=make_stub_fetch(
            [
                (
                    "https://api.data.stats.govt.nz/rest/dataflow/STATSNZ/all",
                    200,
                    CATALOGUE_XML,
                )
            ]
        )
    )
    dataflows = client.get_dataflow_catalogue()
    assert dataflows[0].id == "AGR_AGR_001"


def test_client_get_codelist():
    xml = """<?xml version="1.0"?>
    <message:Structure xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message"
      xmlns:structure="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure"
      xmlns:common="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common">
      <message:Structures>
        <structure:Codelists>
          <structure:Codelist id="CL_YEAR" agencyID="STATSNZ" version="1.0">
            <structure:Code id="2024">
              <common:Name xml:lang="en">Year ended June 2024</common:Name>
            </structure:Code>
          </structure:Codelist>
        </structure:Codelists>
      </message:Structures>
    </message:Structure>"""
    client = create_stats_nz_client(
        fetch_impl=make_stub_fetch(
            [
                (
                    "https://api.data.stats.govt.nz/rest/codelist/STATSNZ/CL_YEAR",
                    200,
                    xml,
                )
            ]
        )
    )
    codelist = client.get_codelist("CL_YEAR")
    assert codelist.id == "CL_YEAR"
    assert codelist.items[0].name == "Year ended June 2024"


def test_client_get_codelist_with_version():
    client = create_stats_nz_client(
        fetch_impl=make_stub_fetch(
            [
                (
                    "https://api.data.stats.govt.nz/rest/codelist/STATSNZ/CL_YEAR/1.0",
                    200,
                    "<Structure></Structure>",
                )
            ]
        )
    )
    with pytest.raises(StatsNzParseError):
        client.get_codelist("CL_YEAR", version="1.0")
