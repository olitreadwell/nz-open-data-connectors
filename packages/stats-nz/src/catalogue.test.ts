import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseDataflowCatalogueXml } from './catalogue';
import { StatsNzParseError } from './errors';

const FIXTURE = readFileSync(
  new URL('./fixtures/dataflow-catalogue-subset.xml', import.meta.url),
  'utf8',
);

describe('parseDataflowCatalogueXml', () => {
  it('parses real catalogue XML into dataflows', () => {
    const flows = parseDataflowCatalogueXml(FIXTURE);
    expect(flows).toHaveLength(3);
    expect(flows[0]).toMatchObject({
      id: 'AGR_AGR_001',
      agencyId: 'STATSNZ',
      version: '1.0',
      title: 'Forestry by Regional Council',
    });
    expect(flows[2]?.title).toBe('Livestock Numbers by Regional Council');
  });

  it('handles a catalogue with a single dataflow', () => {
    const xml =
      '<message:Structure><message:Structures><structure:Dataflows><structure:Dataflow id="X" agencyID="STATSNZ" version="1.0"><common:Name xml:lang="en">Only table</common:Name></structure:Dataflow></structure:Dataflows></message:Structures></message:Structure>';
    expect(parseDataflowCatalogueXml(xml)).toHaveLength(1);
  });

  it('returns an empty list when there are no dataflows', () => {
    expect(
      parseDataflowCatalogueXml('<message:Structure><structure:Dataflows/></message:Structure>'),
    ).toEqual([]);
  });

  it('throws StatsNzParseError for invalid XML', () => {
    expect(() => parseDataflowCatalogueXml('not xml at all <')).toThrow(StatsNzParseError);
  });
});
