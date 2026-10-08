# frozen_string_literal: true

module Nzdata
  # Timeout for every outbound HTTP request, in milliseconds.
  #
  # This lives on its own so `sources.rb` and `stats_nz.rb` can both use it
  # without one of them redefining the constant and triggering a Ruby
  # "already initialized constant" warning at load time.
  DEFAULT_TIMEOUT_MS = 30_000
end
