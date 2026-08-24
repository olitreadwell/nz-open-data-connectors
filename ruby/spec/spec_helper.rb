# frozen_string_literal: true

require 'simplecov'
SimpleCov.start do
  add_filter '/spec/'
  add_filter '/lib/nzdata/fixtures/'
  minimum_coverage 60
end

require 'minitest/autorun'
require 'nzdata'
