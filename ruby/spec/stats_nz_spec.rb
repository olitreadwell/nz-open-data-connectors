# frozen_string_literal: true

require_relative 'spec_helper'
require 'socket'

describe Nzdata do
  LIVESTOCK_CSV = Nzdata.read_fixture_text('agricultural-livestock-regional-council-2025-08-17.csv')
  CATALOGUE_XML = Nzdata.read_fixture_text('dataflow-catalogue-subset.xml')

  describe 'parse_stats_nz_csv' do
    it 'reads dimensions and values' do
      rows = Nzdata.parse_stats_nz_csv(LIVESTOCK_CSV, 'AGR_AGR_003')
      _(rows.length).must_be :>, 0
      first = rows.first
      _(first.dimensions).must_equal('LIVESTOCK' => '6731', 'AREA' => '8', 'YEAR' => '1994')
      _(first.value).must_equal 7_458_218.0
      _(first.status).must_be_nil
    end

    it 'rejects a CSV missing the value column' do
      _(-> { Nzdata.parse_stats_nz_csv("a,b\n1,2\n", 'AGR_AGR_003') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'rejects a non-finite value' do
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE,DATAFLOW\nnot-a-number,AGR_AGR_003\n", 'AGR_AGR_003') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'rejects a non-finite value' do
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE,DATAFLOW\n1e400,AGR_AGR_003\n", 'AGR_AGR_003') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'returns no rows for empty input' do
      _(Nzdata.parse_stats_nz_csv('', 'AGR_AGR_003')).must_equal []
    end

    it 'rejects a row with more fields than the header' do
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE,DATAFLOW\n7,AGR_AGR_003,extra\n", 'AGR_AGR_003') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'matches TypeScript number parsing' do
      _(Nzdata.parse_stats_nz_csv("OBS_VALUE\n0x10\n", 'X').first.value).must_equal 16.0
      _(Nzdata.parse_stats_nz_csv("OBS_VALUE\n1.\n", 'X').first.value).must_equal 1.0
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE\n1_000\n", 'X') })
        .must_raise Nzdata::StatsNzParseError
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE\n1e400\n", 'X') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'keeps a blank record like TypeScript' do
      rows = Nzdata.parse_stats_nz_csv("OBS_VALUE\n7\n\n", 'X')
      _(rows.map(&:value)).must_equal [7.0, nil]
    end

    it 'rejects malformed CSV' do
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE\n\"unterminated\n", 'AGR_AGR_003') })
        .must_raise Nzdata::StatsNzParseError
    end
  end

  describe 'serialize_stats_nz_rows_to_csv' do
    it 'round-trips through the CSV module' do
      rows = Nzdata.parse_stats_nz_csv(LIVESTOCK_CSV, 'AGR_AGR_003').first(3)
      text = Nzdata.serialize_stats_nz_rows_to_csv(rows)
      records = CSV.parse(text, headers: true)
      _(records.length).must_equal 3
      _(records.first['LIVESTOCK']).must_equal '6731'
      _(records.first['value']).must_equal '7458218'
    end

    it 'returns an empty string for no rows' do
      _(Nzdata.serialize_stats_nz_rows_to_csv([])).must_equal ''
    end

    it 'escapes commas and quotes' do
      row = Nzdata::StatsNzObservation.new({ 'AREA' => 'a,b "c"' }, 1)
      _(Nzdata.serialize_stats_nz_rows_to_csv([row])).must_equal 'AREA,value' + "\n" + '"a,b ""c""",1'
    end
  end

  describe 'parse_dataflow_catalogue_xml' do
    it 'parses the fixture' do
      dataflows = Nzdata.parse_dataflow_catalogue_xml(CATALOGUE_XML)
      _(dataflows.length).must_be :>, 0
      first = dataflows.first
      _(first.id).must_equal 'AGR_AGR_001'
      _(first.agency_id).must_equal 'STATSNZ'
      _(first.version).must_equal '1.0'
      _(first.title).must_equal 'Forestry by Regional Council'
    end

    it 'rejects XML without a Structure element' do
      _(-> { Nzdata.parse_dataflow_catalogue_xml('<xml></xml>') })
        .must_raise Nzdata::StatsNzParseError
    end
  end

  describe 'parse_codelist_xml' do
    CODELIST_XML = <<~XML
      <?xml version="1.0"?>
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
      </message:Structure>
    XML

    it 'parses a codelist' do
      codelist = Nzdata.parse_codelist_xml(CODELIST_XML)
      _(codelist.id).must_equal 'CL_YEAR'
      _(codelist.agency_id).must_equal 'STATSNZ'
      _(codelist.items.first.id).must_equal '2024'
      _(codelist.items.first.name).must_equal 'Year ended June 2024'
    end

    it 'rejects XML without a Codelist element' do
      _(-> { Nzdata.parse_codelist_xml('<Structure></Structure>') })
        .must_raise Nzdata::StatsNzParseError
    end
  end

  describe 'parse_sdmx_json_response' do
    SDMX_JSON = JSON.generate(
      {
        'data' => {
          'dataSets' => [
            {
              'series' => {
                '0:0:0' => { 'observations' => { '0' => [23_583_001] } },
                '0:1:0' => { 'observations' => { '0' => [123.5, [1]] } }
              }
            }
          ],
          'structure' => {
            'dimensions' => {
              'series' => [
                { 'id' => 'LIVESTOCK', 'name' => 'Livestock',
                  'values' => [{ 'id' => '6731', 'name' => 'Sheep' }] },
                { 'id' => 'AREA', 'name' => 'Area',
                  'values' => [{ 'id' => '20', 'name' => 'New Zealand' },
                               { 'id' => '1', 'name' => 'Northland' }] },
                { 'id' => 'YEAR', 'name' => 'Year',
                  'values' => [{ 'id' => '2024', 'name' => '2024' }] }
              ],
              'observation' => [
                { 'id' => 'TIME_PERIOD', 'name' => 'Time',
                  'values' => [{ 'id' => '2024', 'name' => '2024' }] }
              ]
            },
            'attributes' => {
              'observation' => [
                { 'id' => 'OBS_STATUS', 'name' => 'Status',
                  'values' => [{ 'id' => '', 'name' => 'Normal' },
                               { 'id' => 's', 'name' => 'Suppressed' }] }
              ]
            }
          }
        }
      }
    )

    it 'reads series and observation dimensions' do
      rows = Nzdata.parse_sdmx_json_response(SDMX_JSON)
      _(rows.length).must_equal 2
      _(rows.first.dimensions).must_equal('LIVESTOCK' => '6731', 'AREA' => '20',
                                          'YEAR' => '2024', 'TIME_PERIOD' => '2024')
      _(rows.first.labels).must_equal('LIVESTOCK' => 'Sheep', 'AREA' => 'New Zealand',
                                      'YEAR' => '2024', 'TIME_PERIOD' => '2024')
      _(rows.first.value).must_equal 23_583_001
      _(rows.first.status).must_be_nil
    end

    it 'maps the status attribute' do
      _(Nzdata.parse_sdmx_json_response(SDMX_JSON)[1].status).must_equal 's'
    end

    it 'returns no rows without datasets' do
      payload = JSON.parse(SDMX_JSON)
      payload['data']['dataSets'] = []
      _(Nzdata.parse_sdmx_json_response(JSON.generate(payload))).must_equal []
    end

    it 'rejects invalid JSON' do
      _(-> { Nzdata.parse_sdmx_json_response('{not json') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'rejects a response missing structure' do
      _(-> { Nzdata.parse_sdmx_json_response('{"data":{}}') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'rejects bare NaN JSON' do
      _(-> { Nzdata.parse_sdmx_json_response('{"data": NaN}') })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'rejects string and boolean observation values' do
      ['"1"', 'true'].each do |value|
        payload = JSON.parse(SDMX_JSON)
        payload['data']['dataSets'][0]['series']['0:0:0']['observations']['0'] = [JSON.parse(value)]
        _(-> { Nzdata.parse_sdmx_json_response(JSON.generate(payload)) })
          .must_raise Nzdata::StatsNzParseError
      end
    end

    it 'rejects non-finite observation values' do
      _(-> { Nzdata.parse_sdmx_json_response(SDMX_JSON.sub('23583001', '1e400')) })
        .must_raise Nzdata::StatsNzParseError
    end

    it 'allows an empty observation' do
      payload = JSON.parse(SDMX_JSON)
      payload['data']['dataSets'][0]['series']['0:0:0']['observations']['0'] = []
      _(Nzdata.parse_sdmx_json_response(JSON.generate(payload)).first.value).must_be_nil
    end

    it 'rejects a null observation attribute list' do
      payload = JSON.parse(SDMX_JSON)
      payload['data']['structure']['attributes']['observation'] = nil
      _(-> { Nzdata.parse_sdmx_json_response(JSON.generate(payload)) })
        .must_raise Nzdata::StatsNzParseError
    end
  end

  describe 'StatsNzClient' do
    def stub_fetch(responses)
      lambda do |url, _headers, _timeout_ms|
        match = responses.find { |expected_url, _status, _body| url == expected_url }
        raise "unexpected URL: #{url}" if match.nil?

        [match[1], match[2]]
      end
    end

    it 'builds the data URL and parses rows' do
      client = Nzdata.create_stats_nz_client(
        fetch_impl: stub_fetch(
          [['https://api.data.stats.govt.nz/rest/data/STATSNZ,AGR_AGR_003,1.0/all?format=csv', 200, LIVESTOCK_CSV]]
        )
      )
      rows = client.get_data('AGR_AGR_003')
      _(rows.first.value).must_equal 7_458_218.0
    end

    it 'follows an HTTP redirect' do
      server = TCPServer.new('127.0.0.1', 0)
      port = server.addr[1]
      requests = []
      thread = Thread.new do
        loop do
          socket = server.accept
          request = +''
          while (line = socket.gets)
            request << line
            break if line == "\r\n"
          end
          requests << request
          if requests.length == 1
            socket.write("HTTP/1.1 302 Found\r\nlocation: /final\r\ncontent-length: 0\r\n\r\n")
          else
            body = "OBS_VALUE,DATAFLOW\n7,AGR_AGR_003\n"
            socket.write("HTTP/1.1 200 OK\r\ncontent-length: #{body.bytesize}\r\n\r\n#{body}")
          end
          socket.close
        end
      rescue IOError, Errno::EBADF
        nil
      end

      client = Nzdata.create_stats_nz_client(base_url: "http://127.0.0.1:#{port}/rest")
      rows = client.get_data('AGR_AGR_003')
      _(rows.first.value).must_equal 7.0
      _(requests.length).must_equal 2
    ensure
      server&.close
      thread&.kill
    end

    it 'sends the subscription key header' do
      seen = {}
      client = Nzdata.create_stats_nz_client(
        subscription_key: 'secret',
        fetch_impl: lambda { |_url, headers, _timeout_ms|
          seen.merge!(headers)
          [200, LIVESTOCK_CSV]
        }
      )
      client.get_data('AGR_AGR_003')
      _(seen['Ocp-Apim-Subscription-Key']).must_equal 'secret'
    end

    it 'raises a retryable API error on 500' do
      client = Nzdata.create_stats_nz_client(fetch_impl: ->(_u, _h, _t) { [500, 'boom'] })
      error = _(-> { client.get_data('AGR_AGR_003') }).must_raise Nzdata::StatsNzApiError
      _(error.status).must_equal 500
      _(error.retryable).must_equal true
    end

    it 'raises on 429' do
      client = Nzdata.create_stats_nz_client(fetch_impl: ->(_u, _h, _t) { [429, 'slow down'] })
      error = _(-> { client.get_data('AGR_AGR_003') }).must_raise Nzdata::StatsNzApiError
      _(error.retryable).must_equal true
    end

    it 'rejects an unknown format' do
      client = Nzdata.create_stats_nz_client(fetch_impl: ->(_u, _h, _t) { [200, ''] })
      _(-> { client.get_data('AGR_AGR_003', format: 'xml') }).must_raise Nzdata::StatsNzError
    end

    it 'parses jsondata with a JSON accept header' do
      seen = {}
      client = Nzdata.create_stats_nz_client(
        fetch_impl: lambda { |_url, headers, _timeout_ms|
          seen.merge!(headers)
          [200, JSON.generate(
            {
              'data' => {
                'dataSets' => [{ 'series' => { '0:0' => { 'observations' => { '0' => [7] } } } }],
                'structure' => {
                  'dimensions' => {
                    'series' => [{ 'id' => 'DIM', 'name' => 'Dim',
                                   'values' => [{ 'id' => 'd1', 'name' => 'Dim one' }] }],
                    'observation' => [{ 'id' => 'TIME_PERIOD', 'name' => 'Time',
                                        'values' => [{ 'id' => '2024', 'name' => '2024' }] }]
                  },
                  'attributes' => { 'observation' => [] }
                }
              }
            }
          )]
        }
      )
      rows = client.get_data('AGR_AGR_003', format: 'jsondata')
      _(rows.first.value).must_equal 7
      _(rows.first.dimensions).must_equal('DIM' => 'd1', 'TIME_PERIOD' => '2024')
      _(seen['Accept']).must_equal 'application/json'
    end

    it 'lists the dataflow catalogue' do
      client = Nzdata.create_stats_nz_client(
        fetch_impl: stub_fetch(
          [['https://api.data.stats.govt.nz/rest/dataflow/STATSNZ/all', 200, CATALOGUE_XML]]
        )
      )
      dataflows = client.get_dataflow_catalogue
      _(dataflows.first.id).must_equal 'AGR_AGR_001'
    end

    it 'fetches a codelist' do
      xml = <<~XML
        <?xml version="1.0"?>
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
        </message:Structure>
      XML
      client = Nzdata.create_stats_nz_client(
        fetch_impl: stub_fetch(
          [['https://api.data.stats.govt.nz/rest/codelist/STATSNZ/CL_YEAR', 200, xml]]
        )
      )
      codelist = client.get_codelist('CL_YEAR')
      _(codelist.id).must_equal 'CL_YEAR'
      _(codelist.items.first.name).must_equal 'Year ended June 2024'
    end
  end
end
