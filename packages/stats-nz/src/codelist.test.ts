import { describe, expect, it } from 'vitest';

import { parseCodelistXml } from './codelist';
import { StatsNzParseError } from './errors';

describe('parseCodelistXml', () => {
  it('parses a codelist XML document into items', () => {
    const xml = `<message:Structure xmlns:structure="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure" xmlns:common="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common">
      <message:Structures><structure:Codelists><structure:Codelist id="CL_X" agencyID="STATSNZ" version="1.0">
        <common:Name xml:lang="en">Example codelist</common:Name>
        <structure:Code id="A"><common:Name xml:lang="en">Alpha</common:Name></structure:Code>
        <structure:Code id="B"><common:Name xml:lang="en">Bravo</common:Name></structure:Code>
      </structure:Codelist></structure:Codelists></message:Structures></message:Structure>`;
    expect(parseCodelistXml(xml)).toEqual({
      id: 'CL_X',
      agencyId: 'STATSNZ',
      version: '1.0',
      items: [
        { id: 'A', name: 'Alpha' },
        { id: 'B', name: 'Bravo' },
      ],
    });
  });

  it('throws StatsNzParseError for invalid XML', () => {
    expect(() => parseCodelistXml('<<<not xml')).toThrow(StatsNzParseError);
  });

  it('throws StatsNzParseError when no codelist is present', () => {
    expect(() =>
      parseCodelistXml(
        '<message:Structure><message:Structures><structure:Codelists/></message:Structures></message:Structure>',
      ),
    ).toThrow(StatsNzParseError);
  });
});
