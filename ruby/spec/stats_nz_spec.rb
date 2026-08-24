# frozen_string_literal: true

require_relative 'spec_helper'

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
      _(-> { Nzdata.parse_stats_nz_csv("OBS_VALUE_AGR_AGR_003\nnot-a-number\n", 'AGR_AGR_003') })
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

    it 'rejects jsondata in the Ruby port' do
      client = Nzdata.create_stats_nz_client(fetch_impl: ->(_u, _h, _t) { [200, ''] })
      _(-> { client.get_data('AGR_AGR_003', format: 'jsondata') }).must_raise Nzdata::StatsNzError
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
