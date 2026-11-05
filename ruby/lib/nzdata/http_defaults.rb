# frozen_string_literal: true

require 'uri'

module Nzdata
  # Identifies this client to the public APIs it calls.
  USER_AGENT = 'nz-open-data-connectors (Language=Ruby)'

  # Timeout for every outbound HTTP request, in milliseconds.
  #
  # This lives on its own so `sources.rb` and `stats_nz.rb` can both use it
  # without one of them redefining the constant and triggering a Ruby
  # "already initialized constant" warning at load time.
  DEFAULT_TIMEOUT_MS = 30_000

  SENSITIVE_REDIRECT_HEADERS = %w[
    authorization proxy-authorization cookie set-cookie host
  ].freeze

  SENSITIVE_REDIRECT_HEADER_PARTS = %w[
    api-key apikey subscription-key access-token auth-token access-key auth secret token
  ].freeze

  module_function

  def build_request_headers(headers)
    request_headers = { 'user-agent' => USER_AGENT }
    headers.each do |name, value|
      if name.to_s.casecmp('user-agent').zero?
        request_headers['user-agent'] = value
      else
        request_headers[name.to_s] = value
      end
    end
    request_headers
  end

  def sensitive_redirect_header?(name)
    lowered = name.to_s.downcase
    SENSITIVE_REDIRECT_HEADERS.include?(lowered) ||
      SENSITIVE_REDIRECT_HEADER_PARTS.any? { |part| lowered.include?(part) }
  end

  def redirect_headers(headers, from_url, to_url)
    return headers.dup if same_origin?(from_url, to_url)

    headers.reject { |name, _value| sensitive_redirect_header?(name) }
  end

  def same_origin?(left, right)
    left_uri = URI(left.to_s)
    right_uri = URI(right.to_s)
    left_uri.scheme.to_s.downcase == right_uri.scheme.to_s.downcase &&
      left_uri.host.to_s.downcase == right_uri.host.to_s.downcase &&
      left_uri.port == right_uri.port
  end
end
