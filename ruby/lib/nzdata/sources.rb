# frozen_string_literal: true

require 'json'
require 'net/http'
require 'rexml/document'
require 'uri'

module Nzdata
  Adapter = Struct.new(:id, :name, :auth, :description, :fetch_live, :parse, :load_fixture)
  Probe = Struct.new(:id, :name, :auth, :ok, :status, :sample)

  AdeDataflow = Struct.new(:dataflow_id, :version, :agency_id, :name, :dimensions)
  AdeSearchResult = Struct.new(:num_found, :dataflows)
  DataGovtNzDataset = Struct.new(:name, :title, :notes, :metadata_modified, :url, :organization)
  DataGovtNzSearchResult = Struct.new(:count, :datasets)
  DataGovtDatastoreResult = Struct.new(:resource_id, :total, :records)
  DigitalNzRecord = Struct.new(:id, :title, :description, :content_partner, :collection, :url)
  GeoNetQuake = Struct.new(:public_id, :time, :depth_km, :magnitude, :mmi, :locality, :quality, :latitude, :longitude)
  GeoNetQuakeSummary = Struct.new(:total, :strongest, :shallowest, :by_magnitude_band)
  LinzLayer = Struct.new(:id, :title, :url)
  NzorName = Struct.new(:name_id, :class_name, :full_name)
  NzorSearchResult = Struct.new(:total, :names)
  TradeMeCategory = Struct.new(:name, :number, :path, :is_leaf, :subcategories)

  DEFAULT_TIMEOUT_MS = 30_000
  FIXTURES_DIR = File.expand_path('fixtures', __dir__)
  MSD_BENEFIT_RESOURCE_ID = '9144a616-9ab1-4475-972b-ac42c1f891b7'

  module_function

  def read_fixture_json(filename)
    JSON.parse(File.read(File.join(FIXTURES_DIR, filename)))
  end

  def read_fixture_text(filename)
    File.read(File.join(FIXTURES_DIR, filename))
  end

  def http_get(url, headers = {}, timeout_ms = DEFAULT_TIMEOUT_MS)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.open_timeout = timeout_ms / 1000.0
    http.read_timeout = timeout_ms / 1000.0
    request = Net::HTTP::Get.new(uri)
    headers.each { |key, value| request[key] = value }
    response = http.request(request)
    [response.code.to_i, response.body.to_s]
  end

  def get_text(url, headers = {})
    status, body = http_get(url, headers)
    raise NzSourceApiError.new('HTTP request', "HTTP #{status}") unless status.between?(200, 299)

    body
  end

  def get_json(url, headers = {})
    JSON.parse(get_text(url, headers))
  end

  # --- Aotearoa Data Explorer search -------------------------------------

  def parse_ade_search_results(payload)
    raise NzSourceParseError.new('ADE search', 'invalid search payload') unless payload.is_a?(Hash)

    AdeSearchResult.new(
      payload.fetch('numFound', 0),
      payload.fetch('dataflows', []).map do |flow|
        AdeDataflow.new(
          flow.fetch('dataflowId', ''),
          flow.fetch('version', ''),
          flow.fetch('agencyId', ''),
          flow.fetch('name', ''),
          flow.fetch('dimensions', [])
        )
      end
    )
  end

  def search_ade_tables(query, limit: 20)
    url = "https://explore.data.stats.govt.nz/sfs/api/search?tenant=public&q=#{URI.encode_www_form_component(query)}&limit=#{limit}"
    parse_ade_search_results(get_json(url))
  end

  ade_search_adapter = Adapter.new(
    'ade-search',
    'Aotearoa Data Explorer search index',
    'none',
    'Searches ADE table IDs and titles by keyword.',
    ->(_api_key) { search_ade_tables('median annual earnings', limit: 5) },
    ->(payload) { parse_ade_search_results(payload) },
    -> { parse_ade_search_results(read_fixture_json('ade-search-earnings.json')) }
  )

  # --- data.govt.nz catalogue --------------------------------------------

  def parse_data_govt_nz_datasets(payload)
    raise NzSourceParseError.new('data.govt.nz', 'invalid search payload') unless payload.is_a?(Hash)
    raise NzSourceParseError.new('data.govt.nz', 'invalid search payload') unless payload['result'].is_a?(Hash)

    result = payload['result']
    DataGovtNzSearchResult.new(
      result.fetch('count', 0),
      result.fetch('results', []).map do |dataset|
        organization = dataset['organization']
        DataGovtNzDataset.new(
          dataset.fetch('name', ''),
          dataset.fetch('title', ''),
          dataset.fetch('notes', ''),
          dataset.fetch('metadata_modified', ''),
          dataset.fetch('url', ''),
          organization.is_a?(Hash) ? organization['title'] : nil
        )
      end
    )
  end

  def search_data_govt_nz_datasets(query)
    url = "https://catalogue.data.govt.nz/api/3/action/package_search?q=#{URI.encode_www_form_component(query)}&rows=20"
    parse_data_govt_nz_datasets(get_json(url))
  end

  data_govt_nz_adapter = Adapter.new(
    'data-govt-nz',
    'data.govt.nz catalogue',
    'none',
    'CKAN package_search over the national open data catalogue.',
    ->(_api_key) { search_data_govt_nz_datasets('sheep') },
    ->(payload) { parse_data_govt_nz_datasets(payload) },
    -> { parse_data_govt_nz_datasets(read_fixture_json('data-govt-nz-search-sheep.json')) }
  )

  # --- data.govt.nz datastore --------------------------------------------

  def parse_data_govt_datastore_rows(payload)
    raise NzSourceParseError.new('data.govt.nz datastore', 'invalid datastore payload') unless payload.is_a?(Hash)
    raise NzSourceParseError.new('data.govt.nz datastore', 'invalid datastore payload') unless payload['result'].is_a?(Hash)

    result = payload['result']
    DataGovtDatastoreResult.new(
      result.fetch('resource_id', ''),
      result.fetch('total', 0),
      result.fetch('records', [])
    )
  end

  def fetch_data_govt_datastore_rows(resource_id, limit: 1000)
    url = "https://catalogue.data.govt.nz/api/3/action/datastore_search?resource_id=#{URI.encode_www_form_component(resource_id)}&limit=#{limit}"
    parse_data_govt_datastore_rows(get_json(url))
  end

  data_govt_datastore_adapter = Adapter.new(
    'data-govt-datastore',
    'data.govt.nz datastore (MSD benefits)',
    'none',
    'CKAN datastore_search rows, defaulting to national MSD benefit data.',
    ->(_api_key) { fetch_data_govt_datastore_rows(MSD_BENEFIT_RESOURCE_ID) },
    ->(payload) { parse_data_govt_datastore_rows(payload) },
    -> { parse_data_govt_datastore_rows(read_fixture_json('data-govt-datastore-msd-benefits.json')) }
  )

  # --- DigitalNZ ---------------------------------------------------------

  def parse_digital_nz_records(payload)
    raise NzSourceParseError.new('DigitalNZ', 'invalid search payload') unless payload.is_a?(Hash)
    raise NzSourceParseError.new('DigitalNZ', 'invalid search payload') unless payload['search'].is_a?(Hash)

    payload['search'].fetch('results', []).map do |record|
      DigitalNzRecord.new(
        record.fetch('id', 0),
        record.fetch('title', ''),
        record.fetch('description', nil).to_s,
        record.fetch('display_content_partner', nil).to_s,
        record.fetch('display_collection', nil).to_s,
        record.fetch('landing_url', nil).to_s
      )
    end
  end

  def search_digital_nz_records(query, api_key: nil)
    params = [['text', query], ['per_page', '20']]
    params << ['api_key', api_key] unless api_key.nil?
    url = "https://api.digitalnz.org/v3/records.json?#{URI.encode_www_form(params)}"
    parse_digital_nz_records(get_json(url))
  end

  digital_nz_adapter = Adapter.new(
    'digitalnz',
    'DigitalNZ (National Library)',
    'none',
    'Search over 1.7 million digitised NZ records.',
    ->(api_key) { search_digital_nz_records('sheep', api_key: api_key) },
    ->(payload) { parse_digital_nz_records(payload) },
    -> { parse_digital_nz_records(read_fixture_json('digitalnz-search-sheep.json')) }
  )

  # --- GeoNet ------------------------------------------------------------

  def parse_geonet_quakes(payload)
    unless payload.is_a?(Hash) && payload['type'] == 'FeatureCollection' && payload['features'].is_a?(Array)
      raise NzSourceParseError.new('GeoNet', 'invalid GeoJSON payload')
    end

    payload['features'].map do |feature|
      props = feature.fetch('properties', {})
      geometry = feature.fetch('geometry', {})
      coordinates = geometry.is_a?(Hash) ? geometry.fetch('coordinates', []) : []
      GeoNetQuake.new(
        props.fetch('publicID', ''),
        props.fetch('time', ''),
        props.fetch('depth', 0.0),
        props.fetch('magnitude', 0.0),
        props.fetch('mmi', 0),
        props.fetch('locality', ''),
        props.fetch('quality', ''),
        coordinates[1] || 0.0,
        coordinates[0] || 0.0
      )
    end
  end

  def summarize_geonet_quakes(quakes)
    by_magnitude_band = Hash.new(0)
    quakes.each do |quake|
      band = if quake.magnitude >= 5
               '5+'
             elsif quake.magnitude >= 4
               '4-5'
             else
               '3-4'
             end
      by_magnitude_band[band] += 1
    end
    strongest = quakes.max_by(&:magnitude)
    shallowest = quakes.min_by(&:depth_km)
    GeoNetQuakeSummary.new(quakes.length, strongest, shallowest, by_magnitude_band)
  end

  def fetch_geonet_felt_quakes(min_mmi = 3)
    parse_geonet_quakes(get_json("https://api.geonet.org.nz/quake?MMI=#{min_mmi}"))
  end

  geonet_adapter = Adapter.new(
    'geonet',
    'GeoNet (GNS Science)',
    'none',
    'Recent felt earthquakes (MMI >= 3) as GeoJSON.',
    ->(_api_key) { fetch_geonet_felt_quakes(3) },
    ->(payload) { parse_geonet_quakes(payload) },
    -> { parse_geonet_quakes(read_fixture_json('geonet-quakes-mmi3.json')) }
  )

  # --- LINZ --------------------------------------------------------------

  def parse_linz_layers(payload)
    raise NzSourceParseError.new('LINZ', 'invalid layer search payload') unless payload.is_a?(Array)

    payload.map do |layer|
      LinzLayer.new(layer.fetch('id', 0), layer.fetch('title', ''), layer.fetch('url', ''))
    end
  end

  def search_linz_layers(query, api_key: nil)
    url = "https://data.linz.govt.nz/services/api/v1/layers?search=#{URI.encode_www_form_component(query)}"
    headers = api_key.nil? ? {} : { 'x-api-key' => api_key }
    parse_linz_layers(get_json(url, headers))
  end

  linz_adapter = Adapter.new(
    'linz',
    'LINZ Data Service catalogue',
    'none',
    'Searches LINZ layers (property titles, parcels, boundaries).',
    ->(api_key) { search_linz_layers('property', api_key: api_key) },
    ->(payload) { parse_linz_layers(payload) },
    -> { parse_linz_layers(read_fixture_json('linz-layer-search.json')) }
  )

  # --- NZOR --------------------------------------------------------------

  def child_text(element, name)
    child = element.elements[name]
    child.nil? ? '' : child.text.to_s
  end

  def parse_nzor_names(payload)
    doc = REXML::Document.new(payload)
    total_node = REXML::XPath.first(doc, '//Total')
    raise NzSourceParseError.new('NZOR', 'missing Response/Total in XML payload') if total_node.nil? || total_node.text.nil?

    total = Integer(total_node.text)
    names = REXML::XPath.match(doc, '//Name').map do |name_node|
      NzorName.new(
        child_text(name_node, 'NameId'),
        child_text(name_node, 'Class'),
        child_text(name_node, 'FullName')
      )
    end
    NzorSearchResult.new(total, names)
  rescue REXML::ParseException
    raise NzSourceParseError.new('NZOR', 'invalid XML payload')
  rescue ArgumentError
    raise NzSourceParseError.new('NZOR', 'invalid Response/Total in XML payload')
  end

  def search_nzor_names(query)
    parse_nzor_names(get_text("https://data.nzor.org.nz/names?q=#{URI.encode_www_form_component(query)}"))
  end

  nzor_adapter = Adapter.new(
    'nzor',
    'NZ Organisms Register',
    'none',
    'Search 170,000+ scientific and vernacular organism names.',
    ->(_api_key) { search_nzor_names('kiwi') },
    ->(payload) { parse_nzor_names(payload.to_s) },
    -> { parse_nzor_names(read_fixture_text('nzor-names-kiwi.xml')) }
  )

  # --- Trade Me ----------------------------------------------------------

  def to_trademe_category(category)
    raise NzSourceParseError.new('Trade Me', 'invalid category payload') unless category.is_a?(Hash)

    TradeMeCategory.new(
      category.fetch('Name', ''),
      category.fetch('Number', ''),
      category.fetch('Path', ''),
      category.fetch('IsLeaf', false),
      category.fetch('Subcategories', []).map { |child| to_trademe_category(child) }
    )
  end

  def parse_trademe_categories(payload)
    to_trademe_category(payload)
  end

  def fetch_trademe_categories
    parse_trademe_categories(get_json('https://api.trademe.co.nz/v1/Categories.json'))
  end

  trademe_adapter = Adapter.new(
    'trademe',
    'Trade Me categories',
    'none',
    'The public Trade Me category tree.',
    ->(_api_key) { fetch_trademe_categories },
    ->(payload) { parse_trademe_categories(payload) },
    -> { parse_trademe_categories(read_fixture_json('trademe-categories.json')) }
  )

  # --- Registry ----------------------------------------------------------

  NZ_DATA_SOURCES = [
    geonet_adapter,
    data_govt_nz_adapter,
    data_govt_datastore_adapter,
    ade_search_adapter,
    digital_nz_adapter,
    trademe_adapter,
    nzor_adapter,
    linz_adapter
  ].freeze

  def get_nz_data_source(source_id)
    NZ_DATA_SOURCES.find { |source| source.id == source_id }
  end

  def to_jsonable(value)
    case value
    when Struct
      value.members.each_with_object({}) { |member, hash| hash[member] = to_jsonable(value[member]) }
    when Array
      value.map { |item| to_jsonable(item) }
    when Hash
      value.each_with_object({}) { |(key, item), hash| hash[key] = to_jsonable(item) }
    else
      value
    end
  end

  def probe_nz_data_source(adapter, api_key = nil)
    data = adapter.fetch_live.call(api_key)
    Probe.new(adapter.id, adapter.name, adapter.auth, true, 'ok', JSON.generate(to_jsonable(data))[0, 120])
  rescue StandardError => e
    Probe.new(adapter.id, adapter.name, adapter.auth, false, e.message)
  end

  def probe_all_nz_data_sources(api_keys = {})
    NZ_DATA_SOURCES.map { |source| probe_nz_data_source(source, api_keys[source.id]) }
  end
end
