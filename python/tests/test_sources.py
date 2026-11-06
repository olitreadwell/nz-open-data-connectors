"""Unit tests for the NZ data source adapters. Fixtures only, no network."""

import json
from importlib.resources import files

import pytest

import nzdata.sources as sources
from nzdata import (
    NZ_DATA_SOURCES,
    get_nz_data_source,
    probe_nz_data_source,
)
from nzdata.errors import NzSourceParseError
from nzdata.sources import (
    DIGITAL_NZ_CATEGORY_FILTERS,
    DataGovtNzDataset,
    DataGovtNzSearchResult,
    NzDataAdapter,
    parse_ade_search_results,
    parse_data_govt_datastore_rows,
    parse_data_govt_nz_datasets,
    parse_digital_nz_records,
    parse_geonet_quakes,
    parse_linz_layers,
    parse_nzor_names,
    parse_trademe_categories,
    search_ade_tables,
    search_all_data_govt_nz_datasets,
    search_data_govt_nz_datasets,
    search_digital_nz_media,
    summarize_geonet_quakes,
)


def read_fixture_json(filename):
    return json.loads(files("nzdata").joinpath("fixtures", filename).read_text())


def read_fixture_text(filename):
    return files("nzdata").joinpath("fixtures", filename).read_text()


def test_registry_lists_eight_sources():
    assert len(NZ_DATA_SOURCES) == 8
    ids = [source.id for source in NZ_DATA_SOURCES]
    assert ids == [
        "geonet",
        "data-govt-nz",
        "data-govt-datastore",
        "ade-search",
        "digitalnz",
        "trademe",
        "nzor",
        "linz",
    ]
    for source in NZ_DATA_SOURCES:
        assert source.name
        assert source.auth in ("none", "key", "account")
        assert source.description


def test_get_nz_data_source_finds_and_misses():
    assert get_nz_data_source("linz") is not None
    assert get_nz_data_source("not-a-source") is None


def test_every_adapter_loads_its_fixture():
    for source in NZ_DATA_SOURCES:
        data = source.load_fixture()
        assert data is not None, source.id


def test_ade_search_fixture_parses():
    result = parse_ade_search_results(read_fixture_json("ade-search-earnings.json"))
    assert result.num_found == 12
    assert result.dataflows[0].dataflow_id == "LEED_AP1_002"
    assert "Region" in result.dataflows[0].dimensions


def test_ade_search_rejects_bad_payload():
    with pytest.raises(NzSourceParseError):
        parse_ade_search_results("not json")


def test_data_govt_nz_fixture_parses():
    result = parse_data_govt_nz_datasets(read_fixture_json("data-govt-nz-search-sheep.json"))
    assert result.count == 31
    assert len(result.datasets) == 5
    assert result.datasets[0].name
    assert result.datasets[0].license_id == "CC-BY-4.0"
    assert result.datasets[0].license_title == "Creative Commons Attribution 4.0 International"
    assert result.datasets[2].license_id == "CC-BY-NZ-3.0"


def test_data_govt_nz_rejects_bad_payload():
    with pytest.raises(NzSourceParseError):
        parse_data_govt_nz_datasets({"result": "nope"})


def test_data_govt_nz_search_rejects_bad_paging():
    with pytest.raises(ValueError):
        search_data_govt_nz_datasets("housing", rows=0)
    with pytest.raises(ValueError):
        search_data_govt_nz_datasets("housing", rows=1001)
    with pytest.raises(ValueError):
        search_data_govt_nz_datasets("housing", start=-1)


def test_search_all_data_govt_nz_paginates(monkeypatch):
    calls = []

    def fake_search(query, rows=20, start=0):
        calls.append((query, rows, start))
        if start == 0:
            return DataGovtNzSearchResult(
                count=3,
                datasets=[
                    DataGovtNzDataset("a", "A", "", "", "", None),
                    DataGovtNzDataset("b", "B", "", "", "", None),
                ],
            )
        return DataGovtNzSearchResult(
            count=3,
            datasets=[DataGovtNzDataset("c", "C", "", "", "", None)],
        )

    monkeypatch.setattr(sources, "search_data_govt_nz_datasets", fake_search)

    result = search_all_data_govt_nz_datasets("housing", page_size=2)

    assert result.count == 3
    assert [dataset.name for dataset in result.datasets] == ["a", "b", "c"]
    assert calls == [("housing", 2, 0), ("housing", 2, 2)]


def test_search_all_data_govt_nz_stops_on_empty_page(monkeypatch):
    def fake_search(query, rows=20, start=0):
        return DataGovtNzSearchResult(count=10, datasets=[])

    monkeypatch.setattr(sources, "search_data_govt_nz_datasets", fake_search)

    result = search_all_data_govt_nz_datasets("housing")

    assert result.count == 10
    assert result.datasets == []


def test_datastore_fixture_parses():
    result = parse_data_govt_datastore_rows(
        read_fixture_json("data-govt-datastore-msd-benefits.json")
    )
    assert result.total == 16250
    assert len(result.records) == 60
    assert "Benefit_Group" in result.records[0]


def test_digital_nz_fixture_parses():
    records = parse_digital_nz_records(read_fixture_json("digitalnz-search-sheep.json"))
    assert len(records) == 2
    assert records[0].title
    assert records[0].rights == ""
    assert records[0].copyright == ["All rights reserved"]


def test_digital_nz_media_fixture_parses():
    records = parse_digital_nz_records(
        read_fixture_json("digitalnz-media-images-kiwi-20260827.json")
    )
    assert records[0].categories == ["Images"]
    assert records[0].thumbnail_url
    assert records[0].rights == "CC BY 4.0"
    assert records[0].rights_url == ["https://creativecommons.org/licenses/by/4.0/"]
    assert records[0].copyright == ["Some rights reserved"]


def test_digital_nz_media_type_filters():
    assert DIGITAL_NZ_CATEGORY_FILTERS["images"] == "Images"
    assert DIGITAL_NZ_CATEGORY_FILTERS["newspapers"] == "Newspapers"
    assert DIGITAL_NZ_CATEGORY_FILTERS["literature"] == "Books"
    assert DIGITAL_NZ_CATEGORY_FILTERS["artwork"] == "Images"


def test_digital_nz_media_rejects_unknown_type():
    with pytest.raises(ValueError):
        search_digital_nz_media("kiwi", "paintings")


def test_digital_nz_media_builds_category_filter(monkeypatch):
    captured = {}

    def fake_get_json(url):
        captured["url"] = url
        return read_fixture_json("digitalnz-media-newspapers-kiwi-20260827.json")

    monkeypatch.setattr("nzdata.sources._get_json", fake_get_json)
    records = search_digital_nz_media("kiwi", "newspapers")
    assert "and%5Bcategory%5D%5B%5D=Newspapers" in captured["url"]
    assert records[0].categories == ["Newspapers"]


def test_geonet_fixture_parses_and_summarizes():
    quakes = parse_geonet_quakes(read_fixture_json("geonet-quakes-mmi3.json"))
    assert len(quakes) == 100
    assert quakes[0].public_id
    summary = summarize_geonet_quakes(quakes)
    assert summary.total == 100
    assert summary.strongest is not None
    assert summary.shallowest is not None
    assert sum(summary.by_magnitude_band.values()) == 100


def test_geonet_rejects_bad_payload():
    with pytest.raises(NzSourceParseError):
        parse_geonet_quakes({"type": "FeatureCollection", "features": "nope"})


def test_linz_fixture_parses():
    layers = parse_linz_layers(read_fixture_json("linz-layer-search.json"))
    assert len(layers) == 15
    assert layers[0].id == 50804
    assert layers[0].title == "NZ Property Titles"


def test_linz_rejects_bad_payload():
    with pytest.raises(NzSourceParseError):
        parse_linz_layers({"id": 1})


def test_nzor_fixture_parses():
    result = parse_nzor_names(read_fixture_text("nzor-names-kiwi.xml"))
    assert result.total == 170151
    assert len(result.names) > 0
    assert result.names[0].full_name


def test_nzor_rejects_bad_payload():
    with pytest.raises(NzSourceParseError):
        parse_nzor_names("<Response></Response>")


def test_trademe_fixture_parses():
    tree = parse_trademe_categories(read_fixture_json("trademe-categories.json"))
    assert tree.name == "Root"
    assert len(tree.subcategories) == 3


def test_trademe_rejects_bad_payload():
    with pytest.raises(NzSourceParseError):
        parse_trademe_categories("nope")


def test_probe_reports_success_and_failure():
    ok_adapter = NzDataAdapter(
        id="ok",
        name="OK",
        auth="none",
        description="",
        fetch_live=lambda _api_key: {"value": 1},
        parse=lambda payload: payload,
        load_fixture=lambda: {"value": 1},
    )
    ok_probe = probe_nz_data_source(ok_adapter)
    assert ok_probe.ok is True
    assert ok_probe.status == "ok"

    def boom(_api_key):
        raise RuntimeError("down")

    bad_adapter = NzDataAdapter(
        id="bad",
        name="Bad",
        auth="none",
        description="",
        fetch_live=boom,
        parse=lambda payload: payload,
        load_fixture=lambda: {},
    )
    bad_probe = probe_nz_data_source(bad_adapter)
    assert bad_probe.ok is False
    assert "down" in bad_probe.status


def test_probe_all_uses_per_source_keys():
    seen = {}

    def capture(adapter_id):
        def fetch_live(api_key):
            seen[adapter_id] = api_key
            return {}

        return fetch_live

    adapters = [
        NzDataAdapter(
            id="a",
            name="A",
            auth="none",
            description="",
            fetch_live=capture("a"),
            parse=lambda payload: payload,
            load_fixture=lambda: {},
        ),
        NzDataAdapter(
            id="b",
            name="B",
            auth="none",
            description="",
            fetch_live=capture("b"),
            parse=lambda payload: payload,
            load_fixture=lambda: {},
        ),
    ]
    probes = [
        probe_nz_data_source(adapter, {"a": "k1", "b": "k2"}.get(adapter.id))
        for adapter in adapters
    ]
    assert [probe.ok for probe in probes] == [True, True]
    assert seen == {"a": "k1", "b": "k2"}


def test_http_get_sends_the_default_user_agent(monkeypatch):
    captured = {}

    class StubResponse:
        status_code = 200
        text = "{}"
        headers = {}

    def fake_get(url, headers=None, **kwargs):
        captured["headers"] = headers
        return StubResponse()

    monkeypatch.setattr("nzdata.http.httpx.get", fake_get)
    from nzdata.sources import _get_text

    _get_text("https://example.test/data")
    assert captured["headers"] == {"user-agent": "nz-open-data-connectors (Language=Python)"}


def test_http_get_lets_caller_headers_override_the_user_agent(monkeypatch):
    captured = {}

    class StubResponse:
        status_code = 200
        text = "{}"
        headers = {}

    def fake_get(url, headers=None, **kwargs):
        captured["headers"] = headers
        return StubResponse()

    monkeypatch.setattr("nzdata.http.httpx.get", fake_get)
    from nzdata.sources import _get_text

    _get_text("https://example.test/data", {"User-Agent": "other-agent", "Accept": "text/plain"})
    assert captured["headers"] == {"user-agent": "other-agent", "Accept": "text/plain"}


def test_json_fetch_rejects_invalid_json(monkeypatch):
    monkeypatch.setattr("nzdata.sources._get_text", lambda url, headers=None: "not json")
    with pytest.raises(NzSourceParseError):
        search_ade_tables("earnings")
