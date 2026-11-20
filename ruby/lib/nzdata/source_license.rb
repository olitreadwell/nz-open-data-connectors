# frozen_string_literal: true

require 'uri'

module Nzdata
  SourceLicense = Struct.new(:title, :url, :attribution) do
    def initialize(title, url, attribution)
      super(
        validate_text(title, 'title'),
        validate_url(url),
        validate_text(attribution, 'attribution')
      )
      freeze
    end

    private

    def validate_text(value, field)
      unless value.is_a?(String) && !value.strip.empty?
        raise ArgumentError, "Source license #{field} must be a non-empty string"
      end

      value.strip.freeze
    end

    def validate_url(value)
      url = validate_text(value, 'url')
      uri = URI.parse(url)
      unless uri.is_a?(URI::HTTP) && !uri.host.to_s.empty? && (0..65_535).cover?(uri.port)
        raise ArgumentError, 'Source license url must be an absolute HTTP(S) URL'
      end

      url
    rescue URI::InvalidURIError
      raise ArgumentError, 'Source license url must be an absolute HTTP(S) URL'
    end
  end
end
