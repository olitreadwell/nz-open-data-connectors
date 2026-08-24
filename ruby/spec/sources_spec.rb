# frozen_string_literal: true

require_relative 'spec_helper'

describe Nzdata do
  describe 'registry' do
    it 'lists eight sources in order' do
      ids = Nzdata::NZ_DATA_SOURCES.map(&:id)
      _(ids).must_equal %w[geonet data-govt-nz data-govt-datastore ade-search digitalnz trademe nzor linz]
    end

    it 'gives every source a name, auth, and description' do
      Nzdata::NZ_DATA_SOURCES.each do |source|
        _(source.name).wont_be_empty
        _(%w[none key account]).must_include source.auth
        _(source.description).wont_be_empty
      end
    end

    it 'finds a source by id and misses unknown ids' do
      _(Nzdata.get_nz_data_source('linz')).wont_be_nil
      _(Nzdata.get_nz_data_source('not-a-source')).must_be_nil
    end

    it 'loads a fixture for every adapter' do
      Nzdata::NZ_DATA_SOURCES.each do |source|
        _(source.load_fixture.call).wont_be_nil
      end
    end
  end

  describe 'parsers' do
    it 'parses the ADE search fixture' do
      result = Nzdata.parse_ade_search_results(Nzdata.read_fixture_json('ade-search-earnings.json'))
      _(result.num_found).must_equal 12
      _(result.dataflows.first.dataflow_id).must_equal 'LEED_AP1_002'
      _(result.dataflows.first.dimensions).must_include 'Region'
    end

    it 'rejects a bad ADE search payload' do
      _(-> { Nzdata.parse_ade_search_results('nope') }).must_raise Nzdata::NzSourceParseError
    end

    it 'parses the data.govt.nz fixture' do
      result = Nzdata.parse_data_govt_nz_datasets(Nzdata.read_fixture_json('data-govt-nz-search-sheep.json'))
      _(result.count).must_equal 31
      _(result.datasets.length).must_equal 5
    end

    it 'rejects a bad data.govt.nz payload' do
      _(-> { Nzdata.parse_data_govt_nz_datasets('result' => 'nope') }).must_raise Nzdata::NzSourceParseError
    end

    it 'parses the datastore fixture' do
      result = Nzdata.parse_data_govt_datastore_rows(Nzdata.read_fixture_json('data-govt-datastore-msd-benefits.json'))
      _(result.total).must_equal 16_250
      _(result.records.length).must_equal 60
    end

    it 'parses the DigitalNZ fixture' do
      records = Nzdata.parse_digital_nz_records(Nzdata.read_fixture_json('digitalnz-search-sheep.json'))
      _(records.length).must_equal 2
      _(records.first.title).wont_be_empty
    end

    it 'parses and summarizes the GeoNet fixture' do
      quakes = Nzdata.parse_geonet_quakes(Nzdata.read_fixture_json('geonet-quakes-mmi3.json'))
      _(quakes.length).must_equal 100
      summary = Nzdata.summarize_geonet_quakes(quakes)
      _(summary.total).must_equal 100
      _(summary.strongest).wont_be_nil
      _(summary.shallowest).wont_be_nil
      _(summary.by_magnitude_band.values.sum).must_equal 100
    end

    it 'rejects a bad GeoNet payload' do
      _(-> { Nzdata.parse_geonet_quakes('type' => 'FeatureCollection', 'features' => 'nope') })
        .must_raise Nzdata::NzSourceParseError
    end

    it 'parses the LINZ fixture' do
      layers = Nzdata.parse_linz_layers(Nzdata.read_fixture_json('linz-layer-search.json'))
      _(layers.length).must_equal 15
      _(layers.first.id).must_equal 50_804
      _(layers.first.title).must_equal 'NZ Property Titles'
    end

    it 'rejects a bad LINZ payload' do
      _(-> { Nzdata.parse_linz_layers('id' => 1) }).must_raise Nzdata::NzSourceParseError
    end

    it 'parses the NZOR fixture' do
      result = Nzdata.parse_nzor_names(Nzdata.read_fixture_text('nzor-names-kiwi.xml'))
      _(result.total).must_equal 170_151
      _(result.names.length).must_be :>, 0
    end

    it 'rejects a bad NZOR payload' do
      _(-> { Nzdata.parse_nzor_names('<Response></Response>') }).must_raise Nzdata::NzSourceParseError
    end

    it 'parses the Trade Me fixture' do
      tree = Nzdata.parse_trademe_categories(Nzdata.read_fixture_json('trademe-categories.json'))
      _(tree.name).must_equal 'Root'
      _(tree.subcategories.length).must_equal 3
    end

    it 'rejects a bad Trade Me payload' do
      _(-> { Nzdata.parse_trademe_categories('nope') }).must_raise Nzdata::NzSourceParseError
    end
  end

  describe 'probes' do
    it 'reports success and failure' do
      ok_adapter = Nzdata::Adapter.new('ok', 'OK', 'none', '', ->(_k) { { 'value' => 1 } }, ->(p) { p }, -> { {} })
      ok_probe = Nzdata.probe_nz_data_source(ok_adapter)
      _(ok_probe.ok).must_equal true
      _(ok_probe.status).must_equal 'ok'

      bad_adapter = Nzdata::Adapter.new('bad', 'Bad', 'none', '', ->(_k) { raise 'down' }, ->(p) { p }, -> { {} })
      bad_probe = Nzdata.probe_nz_data_source(bad_adapter)
      _(bad_probe.ok).must_equal false
      _(bad_probe.status).must_include 'down'
    end

    it 'passes per-source keys to fetch_live' do
      seen = {}
      adapters = %w[a b].map do |id|
        Nzdata::Adapter.new(
          id, id, 'none', '',
          ->(api_key) { seen[id] = api_key; {} },
          ->(p) { p }, -> { {} }
        )
      end
      adapters.each { |adapter| Nzdata.probe_nz_data_source(adapter, { 'a' => 'k1', 'b' => 'k2' }[adapter.id]) }
      _(seen).must_equal('a' => 'k1', 'b' => 'k2')
    end
  end
end
