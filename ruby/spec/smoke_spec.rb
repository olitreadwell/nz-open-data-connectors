# frozen_string_literal: true

require_relative 'spec_helper'

describe 'live smoke tests' do
  before do
    skip 'set RUN_SMOKE=1 to run live smoke tests' unless ENV['RUN_SMOKE'] == '1'
  end

  it 'probes every source with optional keys' do
    api_keys = {}
    api_keys['linz'] = ENV['LINZ_API_KEY'] unless ENV['LINZ_API_KEY'].nil?
    probes = Nzdata.probe_all_nz_data_sources(api_keys)
    _(probes.length).must_equal 8
    probes.each do |probe|
      _(probe.ok).must_equal true, "#{probe.id}: #{probe.status}"
    end
  end

  it 'pulls the catalogue and agriculture data keyless' do
    client = Nzdata.create_stats_nz_client
    dataflows = client.get_dataflow_catalogue
    _(dataflows.length).must_be :>, 0
    rows = client.get_data('AGR_AGR_003')
    _(rows.length).must_be :>, 0
  end
end
