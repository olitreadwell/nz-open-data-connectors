# frozen_string_literal: true

require 'csv'
require 'json'
require 'net/http'
require 'rexml/document'
require 'uri'

require_relative 'http_defaults'

module Nzdata
  StatsNzDataflow = Struct.new(:id, :agency_id, :version, :title)
  StatsNzObservation = Struct.new(:dimensions, :value, :labels, :status)
  StatsNzCodelistItem = Struct.new(:id, :name)
  StatsNzCodelist = Struct.new(:id, :agency_id, :version, :items)

  DEFAULT_BASE_URL = 'https://api.data.stats.govt.nz/rest'
  DEFAULT_VERSION = '1.0'
  VALID_FORMATS = %w[csv csvfilewithlabels jsondata].freeze

  module_function

  def parse_stats_nz_csv(text, dataflow_id)
    text = text.sub(/\A\uFEFF/, '')
    return [] if text.strip.empty?

    rows = CSV.parse(text)
    return [] if rows.empty?

    records = stats_nz_records(rows)
    return [] if records.empty?
    unless records.first.key?('OBS_VALUE')
      raise StatsNzParseError, 'Stats NZ CSV is missing the OBS_VALUE column'
    end

    records.map { |record| stats_nz_observation(record, dataflow_id) }
  rescue CSV::MalformedCSVError => e
    raise StatsNzParseError, "Malformed Stats NZ CSV: #{e.message}"
  end

  def stats_nz_records(rows)
    header = rows.first
    rows.drop(1).map do |values|
      if values.length > header.length
        raise StatsNzParseError, 'CSV row has more fields than the header row'
      end

      header.each_with_index.to_h { |name, index| [name.to_s, values[index].to_s] }
    end
  end

  def stats_nz_observation(record, dataflow_id)
    suffix = "_#{dataflow_id}"
    label_suffix = "_LABEL#{suffix}"
    dimensions = {}
    labels = {}
    record.each do |key, value|
      next if %w[DATAFLOW OBS_VALUE OBS_STATUS].include?(key)

      if key.end_with?(label_suffix)
        labels[key[0...-label_suffix.length]] = value
        next
      end
      dimensions[key[0...-suffix.length]] = value if key.end_with?(suffix)
    end
    value = parse_observation_value(record['OBS_VALUE'].to_s)

    observation = StatsNzObservation.new(dimensions, value)
    observation.labels = labels unless labels.empty?
    status = record['OBS_STATUS'].to_s.strip
    observation.status = status unless status.empty?
    observation
  end

  DECIMAL_NUMBER = /\A[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?\z/
  RADIX_NUMBER = /\A(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+)\z/

  def parse_observation_value(raw_value)
    return nil if raw_value.empty?

    text = raw_value.strip
    value =
      if text.empty?
        0.0
      elsif RADIX_NUMBER.match?(text)
        Integer(text, 0).to_f
      elsif DECIMAL_NUMBER.match?(text)
        Float(text.sub(/\.(?=[eE]|\z)/, '.0'))
      else
        raise StatsNzParseError, "Invalid OBS_VALUE in Stats NZ CSV: #{raw_value}"
      end
    raise StatsNzParseError, "Invalid OBS_VALUE in Stats NZ CSV: #{raw_value}" unless value.finite?

    value
  rescue ArgumentError, RangeError
    raise StatsNzParseError, "Invalid OBS_VALUE in Stats NZ CSV: #{raw_value}"
  end

  def sdmx_values(values, dimension)
    unless values.is_a?(Array)
      raise StatsNzParseError,
            "Stats NZ jsondata dimension #{dimension} has no values list"
    end
    values.map do |value|
      unless value.is_a?(Hash) && value['id'].is_a?(String) && value['name'].is_a?(String)
        raise StatsNzParseError,
              "Stats NZ jsondata dimension #{dimension} has an invalid value"
      end
      { 'id' => value['id'], 'name' => value['name'] }
    end
  end

  def sdmx_dimensions(value, label)
    unless value.is_a?(Array)
      raise StatsNzParseError,
            "Stats NZ jsondata has no #{label} dimensions list"
    end
    value.map do |dimension|
      unless dimension.is_a?(Hash) && dimension['id'].is_a?(String)
        raise StatsNzParseError,
              "Stats NZ jsondata has an invalid #{label} dimension"
      end
      [dimension['id'], sdmx_values(dimension['values'], dimension['id'])]
    end
  end

  SDMX_SHAPE_ERROR = 'Stats NZ jsondata response does not match the SDMX-JSON shape'

  def parse_sdmx_json_response(text)
    data = sdmx_data(text)
    structure = data['structure']
    dimensions = structure['dimensions']
    series_dimensions = sdmx_dimensions(dimensions['series'], 'series')
    observation_dimensions = sdmx_dimensions(dimensions.fetch('observation', []), 'observation')
    time_dimension = observation_dimensions.find { |id, _values| id == 'TIME_PERIOD' } ||
                     observation_dimensions.first
    status_values = sdmx_status_values(structure)
    data.fetch('dataSets', []).flat_map do |dataset|
      sdmx_dataset_rows(dataset, series_dimensions, time_dimension, status_values)
    end
  end

  def sdmx_data(text)
    payload = JSON.parse(text)
    data = payload.is_a?(Hash) ? payload['data'] : nil
    valid = data.is_a?(Hash) && data.fetch('dataSets', []).is_a?(Array) &&
            data['structure'].is_a?(Hash) && data['structure']['dimensions'].is_a?(Hash)
    raise StatsNzParseError, SDMX_SHAPE_ERROR unless valid

    data
  rescue JSON::ParserError
    raise StatsNzParseError, 'Stats NZ jsondata response is not valid JSON'
  end

  def sdmx_status_values(structure)
    attributes = structure.key?('attributes') ? structure['attributes'] : {}
    raise StatsNzParseError, SDMX_SHAPE_ERROR unless attributes.is_a?(Hash)

    observation_attributes = attributes.key?('observation') ? attributes['observation'] : []
    raise StatsNzParseError, SDMX_SHAPE_ERROR unless observation_attributes.is_a?(Array)

    attribute = observation_attributes.find do |entry|
      entry.is_a?(Hash) && entry['id'] == 'OBS_STATUS'
    end
    attribute && sdmx_values(attribute['values'], 'OBS_STATUS')
  end

  def sdmx_dataset_rows(dataset, series_dimensions, time_dimension, status_values)
    unless dataset.is_a?(Hash) && dataset['series'].is_a?(Hash)
      raise StatsNzParseError, SDMX_SHAPE_ERROR
    end

    dataset['series'].flat_map do |series_key, series|
      sdmx_series_rows(series_key, series, series_dimensions, time_dimension, status_values)
    end
  end

  def sdmx_series_rows(series_key, series, series_dimensions, time_dimension, status_values)
    unless series.is_a?(Hash) && series['observations'].is_a?(Hash)
      raise StatsNzParseError, SDMX_SHAPE_ERROR
    end

    base_dimensions, base_labels = sdmx_series_dimensions(series_key, series_dimensions)
    context = {
      base_dimensions: base_dimensions,
      base_labels: base_labels,
      time_dimension: time_dimension,
      status_values: status_values
    }
    series['observations'].map do |observation_key, observation|
      sdmx_observation_row(observation_key, observation, context)
    end
  end

  def sdmx_series_dimensions(series_key, series_dimensions)
    dimensions = {}
    labels = {}
    parts = series_key.split(':')
    series_dimensions.each_with_index do |(dimension_id, values), index|
      position = sdmx_index(parts[index])
      next if position.nil? || position >= values.length

      dimensions[dimension_id] = values[position]['id']
      labels[dimension_id] = values[position]['name']
    end
    [dimensions, labels]
  end

  def sdmx_observation_row(observation_key, observation, context)
    raise StatsNzParseError, SDMX_SHAPE_ERROR unless observation.is_a?(Array)

    dimensions = context[:base_dimensions].dup
    labels = context[:base_labels].dup
    apply_sdmx_time_dimension(observation_key, context[:time_dimension], dimensions, labels)
    value = sdmx_observation_value(observation)
    row = StatsNzObservation.new(dimensions, value)
    row.labels = labels
    status = sdmx_observation_status(observation, context[:status_values])
    row.status = status unless status.nil?
    row
  end

  def apply_sdmx_time_dimension(observation_key, time_dimension, dimensions, labels)
    return if time_dimension.nil?

    index = sdmx_index(observation_key.split(':').first)
    return if index.nil? || index >= time_dimension[1].length

    period = time_dimension[1][index]
    dimensions['TIME_PERIOD'] = period['id']
    labels['TIME_PERIOD'] = period['name']
  end

  def sdmx_observation_status(observation, status_values)
    return nil if status_values.nil? || observation.length < 2
    return nil unless observation[1].is_a?(Array) && !observation[1].empty?

    index = sdmx_index(observation[1].first)
    return nil if index.nil? || index >= status_values.length

    status = status_values[index]['id']
    status == '' ? nil : status
  end

  def sdmx_index(value)
    case value
    when Integer
      value.negative? ? nil : value
    when Float
      value.finite? && value == value.to_i && !value.negative? ? value.to_i : nil
    when String
      number = Float(value, exception: false)
      number&.finite? && number == number.to_i && !number.negative? ? number.to_i : nil
    end
  end

  def finite_sdmx_number?(value)
    return false unless value.is_a?(Integer) || value.is_a?(Float)

    value.is_a?(Float) ? value.finite? : true
  end

  def sdmx_observation_value(observation)
    observation.each do |entry|
      case entry
      when nil
        next
      when Array
        unless entry.all? { |item| finite_sdmx_number?(item) }
          raise StatsNzParseError, SDMX_SHAPE_ERROR
        end
      else
        raise StatsNzParseError, SDMX_SHAPE_ERROR unless finite_sdmx_number?(entry)
      end
    end
    return nil if observation.empty?

    first = observation.first
    return nil unless finite_sdmx_number?(first)

    Float(first)
  rescue RangeError
    raise StatsNzParseError, SDMX_SHAPE_ERROR
  end

  def format_value(value)
    return '' if value.nil?

    value == value.to_i ? value.to_i.to_s : value.to_s
  end

  def escape_csv_cell(value)
    if value.include?(',') || value.include?('"') || value.include?("\n")
      "\"#{value.gsub('"', '""')}\""
    else
      value
    end
  end

  def serialize_stats_nz_rows_to_csv(rows)
    return '' if rows.empty?

    dimension_keys = rows.flat_map { |row| row.dimensions.keys }.uniq.sort
    has_status = rows.any? { |row| !row.status.nil? }
    header = dimension_keys + ['value'] + (has_status ? ['status'] : [])
    lines = [header.join(',')]
    rows.each do |row|
      cells = dimension_keys.map { |key| row.dimensions[key].to_s }
      cells << format_value(row.value)
      cells << row.status.to_s if has_status
      lines << cells.map { |cell| escape_csv_cell(cell) }.join(',')
    end
    lines.join("\n")
  end

  def parse_dataflow_catalogue_xml(xml)
    doc = REXML::Document.new(xml)
    structure = REXML::XPath.first(doc, '//*[local-name()="Structure"]')
    if structure.nil?
      raise StatsNzParseError,
            'Stats NZ dataflow catalogue XML has no Structure element'
    end

    REXML::XPath.match(doc, '//*[local-name()="Dataflow"]').map do |flow|
      name = REXML::XPath.first(flow, './/*[local-name()="Name"]')
      StatsNzDataflow.new(
        flow.attributes['id'].to_s,
        flow.attributes['agencyID'].to_s,
        flow.attributes['version'].to_s,
        name ? name.text.to_s : ''
      )
    end
  rescue REXML::ParseException
    raise StatsNzParseError, 'Failed to parse Stats NZ dataflow catalogue XML'
  end

  def parse_codelist_xml(xml)
    doc = REXML::Document.new(xml)
    codelist = REXML::XPath.first(doc, '//*[local-name()="Codelist"]')
    raise StatsNzParseError, 'Stats NZ codelist XML has no Codelist element' if codelist.nil?

    items = REXML::XPath.match(codelist, './/*[local-name()="Code"]').map do |code|
      name = REXML::XPath.first(code, './/*[local-name()="Name"]')
      StatsNzCodelistItem.new(code.attributes['id'].to_s, name ? name.text.to_s : '')
    end
    StatsNzCodelist.new(
      codelist.attributes['id'].to_s,
      codelist.attributes['agencyID'].to_s,
      codelist.attributes['version'].to_s,
      items
    )
  rescue REXML::ParseException
    raise StatsNzParseError, 'Failed to parse Stats NZ codelist XML'
  end

  class StatsNzClient
    def initialize(subscription_key: nil, base_url: DEFAULT_BASE_URL,
                   timeout_ms: DEFAULT_TIMEOUT_MS, fetch_impl: nil)
      @base_url = base_url.dup
      @base_url = @base_url[0...-1] while @base_url.end_with?('/')
      @subscription_key = subscription_key
      @timeout_ms = timeout_ms
      @fetch = fetch_impl || method(:default_fetch)
    end

    def get_data(dataflow_id, key: 'all', version: nil, format: 'csv')
      unless VALID_FORMATS.include?(format)
        raise StatsNzError,
              "Unsupported Stats NZ response format: #{format}"
      end
      version ||= DEFAULT_VERSION
      path = "/data/STATSNZ,#{encode(dataflow_id)},#{encode(version)}/" \
             "#{encode(key)}?format=#{format}"
      body = send_request(path, format == 'jsondata' ? 'application/json' : 'text/csv')
      return Nzdata.parse_sdmx_json_response(body) if format == 'jsondata'

      Nzdata.parse_stats_nz_csv(body, dataflow_id)
    end

    def get_dataflow_catalogue
      body = send_request('/dataflow/STATSNZ/all', 'application/xml')
      Nzdata.parse_dataflow_catalogue_xml(body)
    end

    def get_codelist(codelist_id, version: nil)
      version_segment = version.nil? ? '' : "/#{encode(version)}"
      path = "/codelist/STATSNZ/#{encode(codelist_id)}#{version_segment}"
      body = send_request(path, 'application/xml')
      Nzdata.parse_codelist_xml(body)
    end

    private

    def encode(value)
      URI.encode_www_form_component(value)
    end

    def send_request(path, accept)
      url = "#{@base_url}#{path}"
      headers = { 'Accept' => accept, 'Cache-Control' => 'no-cache', 'user-agent' => USER_AGENT }
      headers['Ocp-Apim-Subscription-Key'] = @subscription_key unless @subscription_key.nil?
      status, body = @fetch.call(url, headers, @timeout_ms)
      unless status.between?(200, 299)
        message = "Stats NZ API request failed with status #{status}"
        begin
          parsed = JSON.parse(body)
          message = parsed['message'] if parsed.is_a?(Hash) && parsed['message'].is_a?(String)
        rescue JSON::ParserError
          # keep the default message
        end
        raise StatsNzApiError.new(message, status: status,
                                           retryable: status == 429 || status >= 500, url: url)
      end
      body
    end

    def default_fetch(url, headers, timeout_ms, redirects_left = 5)
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = timeout_ms / 1000.0
      http.read_timeout = timeout_ms / 1000.0
      request = Net::HTTP::Get.new(uri)
      headers.each { |key, value| request[key] = value }
      response = http.request(request)
      if response.is_a?(Net::HTTPRedirection) && redirects_left.positive?
        location = response['location']
        unless location.nil?
          next_url = URI.join(url.to_s, location).to_s
          next_headers = Nzdata.redirect_headers(headers, url, next_url)
          return default_fetch(next_url, next_headers, timeout_ms, redirects_left - 1)
        end
      end
      [response.code.to_i, response.body.to_s]
    rescue StatsNzApiError
      raise
    rescue StandardError => e
      raise StatsNzApiError.new("Stats NZ request failed: #{e.message}", status: 0,
                                                                         retryable: true, url: url)
    end
  end

  def create_stats_nz_client(subscription_key: nil, base_url: DEFAULT_BASE_URL,
                             timeout_ms: DEFAULT_TIMEOUT_MS, fetch_impl: nil)
    StatsNzClient.new(
      subscription_key: subscription_key,
      base_url: base_url,
      timeout_ms: timeout_ms,
      fetch_impl: fetch_impl
    )
  end
end
