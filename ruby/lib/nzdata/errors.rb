# frozen_string_literal: true

module Nzdata
  class Error < StandardError; end

  class NzSourceError < Error; end

  class NzSourceApiError < NzSourceError
    attr_reader :source

    def initialize(source, message)
      @source = source
      super("#{source}: #{message}")
    end
  end

  class NzSourceParseError < NzSourceError
    attr_reader :source

    def initialize(source, message)
      @source = source
      super("#{source}: #{message}")
    end
  end

  class StatsNzError < Error; end

  class StatsNzParseError < StatsNzError; end

  class StatsNzApiError < StatsNzError
    attr_reader :status, :retryable, :url

    def initialize(message, status:, retryable:, url: nil)
      @status = status
      @retryable = retryable
      @url = url
      super(message)
    end
  end
end
