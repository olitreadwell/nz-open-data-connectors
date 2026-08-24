# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = 'nzdata'
  spec.version = '0.1.0'
  spec.summary = 'Connectors for NZ public data'
  spec.description = 'Keyless-first connectors for NZ public data sources and the Aotearoa Data Explorer API.'
  spec.authors = ['Oli Treadwell']
  spec.email = ['oliver.treadwell@gmail.com']
  spec.license = 'MIT'
  spec.homepage = 'https://github.com/olitreadwell/nz-open-data-connectors'
  spec.metadata = {
    'homepage_uri' => 'https://github.com/olitreadwell/nz-open-data-connectors',
    'source_code_uri' => 'https://github.com/olitreadwell/nz-open-data-connectors',
    'changelog_uri' => 'https://github.com/olitreadwell/nz-open-data-connectors/blob/main/CHANGELOG.md',
    'rubygems_mfa_required' => 'true'
  }
  spec.required_ruby_version = '>= 2.6'
  spec.files = Dir['lib/**/*.rb'] + Dir['lib/nzdata/fixtures/**/*']
  spec.require_paths = ['lib']
  spec.add_dependency 'csv', '~> 3.2'
  spec.add_dependency 'rexml', '~> 3.1'
  spec.add_development_dependency 'minitest', '~> 5.0'
  spec.add_development_dependency 'rake', '~> 13.0'
  spec.add_development_dependency 'rubocop', '~> 1.0'
  spec.add_development_dependency 'rubocop-rake', '~> 0.6'
  spec.add_development_dependency 'simplecov', '~> 0.22'
end
