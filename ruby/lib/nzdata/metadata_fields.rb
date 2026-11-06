# frozen_string_literal: true

require_relative 'errors'

module Nzdata
  module_function

  def parse_string(value, source, field_name)
    return '' if value.nil?
    return value if value.is_a?(String)

    raise NzSourceParseError.new(source, "#{field_name} must be a string")
  end

  def parse_string_list(value, source, field_name)
    return [] if value.nil?
    return value.dup if value.is_a?(Array) && value.all?(String)

    raise NzSourceParseError.new(source, "#{field_name} must be a list of strings")
  end

  def digital_nz_attribution(display_partner, content_partners, publishers)
    return display_partner unless display_partner.empty?

    partners = content_partners.reject(&:empty?)
    return partners.join(', ') unless partners.empty?

    publishers.reject(&:empty?).join(', ')
  end

  def digital_nz_record(record)
    display_partner = parse_string(
      record.fetch('display_content_partner', nil), 'DigitalNZ', 'display_content_partner'
    )
    content_partners = parse_string_list(
      record.fetch('content_partner', nil), 'DigitalNZ', 'content_partner'
    )
    publishers = parse_string_list(record.fetch('publisher', nil), 'DigitalNZ', 'publisher')
    DigitalNzRecord.new(
      record.fetch('id', 0),
      record.fetch('title', ''),
      record.fetch('description', nil).to_s,
      digital_nz_attribution(display_partner, content_partners, publishers),
      record.fetch('display_collection', nil).to_s,
      record.fetch('landing_url', nil).to_s,
      record.fetch('category', []).to_a,
      record.fetch('thumbnail_url', nil).to_s,
      record.fetch('large_thumbnail_url', nil).to_s,
      record.fetch('object_url', nil).to_s,
      record.fetch('source_url', nil).to_s,
      record.fetch('display_date', nil).to_s,
      parse_string(record.fetch('rights', nil), 'DigitalNZ', 'rights'),
      parse_string_list(record.fetch('rights_url', nil), 'DigitalNZ', 'rights_url'),
      parse_string_list(record.fetch('copyright', nil), 'DigitalNZ', 'copyright'),
      publishers
    )
  end
end
