import { describe, expect, it } from 'vitest';

import { StatsNzParseError } from './errors';
import { parseSdmxJsonResponse } from './sdmxJson';

const SPEC_FIXTURE = JSON.stringify({
  data: {
    dataSets: [
      {
        series: {
          '0:0:0': { observations: { '0': [23583001] } },
          '0:1:0': { observations: { '0': [123.5, [1]] } },
        },
      },
    ],
    structure: {
      name: 'Livestock Numbers by Regional Council',
      dimensions: {
        dataSet: [],
        series: [
          { id: 'LIVESTOCK', name: 'Livestock', values: [{ id: '6731', name: 'Sheep' }] },
          {
            id: 'AREA',
            name: 'Area',
            values: [
              { id: '20', name: 'New Zealand' },
              { id: '1', name: 'Northland' },
            ],
          },
          { id: 'YEAR', name: 'Year', values: [{ id: '2024', name: '2024' }] },
        ],
        observation: [{ id: 'TIME_PERIOD', name: 'Time', values: [{ id: '2024', name: '2024' }] }],
      },
      attributes: {
        dataSet: [],
        series: [],
        observation: [
          {
            id: 'OBS_STATUS',
            name: 'Status',
            values: [
              { id: '', name: 'Normal' },
              { id: 's', name: 'Suppressed' },
            ],
          },
        ],
      },
    },
  },
});

describe('parseSdmxJsonResponse', () => {
  it('parses a spec-shaped SDMX-JSON document into observations', () => {
    const rows = parseSdmxJsonResponse(SPEC_FIXTURE);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      dimensions: { LIVESTOCK: '6731', AREA: '20', YEAR: '2024', TIME_PERIOD: '2024' },
      labels: { LIVESTOCK: 'Sheep', AREA: 'New Zealand', YEAR: '2024', TIME_PERIOD: '2024' },
      value: 23583001,
    });
  });

  it('maps observation attributes to a status', () => {
    const rows = parseSdmxJsonResponse(SPEC_FIXTURE);
    expect(rows[1]?.status).toBe('s');
    expect(rows[0]?.status).toBeUndefined();
  });

  it('returns an empty list for a document with no datasets', () => {
    const doc = JSON.parse(SPEC_FIXTURE) as { data: { dataSets: unknown[] } };
    doc.data.dataSets = [];
    expect(parseSdmxJsonResponse(JSON.stringify(doc))).toEqual([]);
  });

  it('throws StatsNzParseError for invalid JSON', () => {
    expect(() => parseSdmxJsonResponse('{not json')).toThrow(StatsNzParseError);
  });

  it('throws StatsNzParseError for a response missing structure', () => {
    expect(() => parseSdmxJsonResponse('{"data":{}}')).toThrow(StatsNzParseError);
  });
});
