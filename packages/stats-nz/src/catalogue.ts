import { XMLParser } from 'fast-xml-parser';

import { StatsNzParseError } from './errors';
import type { StatsNzDataflow } from './types';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseDataflowCatalogueXml(xml: string): StatsNzDataflow[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    processEntities: false,
  });

  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch {
    throw new StatsNzParseError('Failed to parse Stats NZ dataflow catalogue XML');
  }

  const structure = asRecord(asRecord(doc)?.Structure);
  if (structure === undefined) {
    throw new StatsNzParseError('Stats NZ dataflow catalogue XML has no Structure element');
  }

  const dataflowsValue = asRecord(asRecord(structure.Structures)?.Dataflows)?.Dataflow;
  const dataflows =
    dataflowsValue === undefined
      ? []
      : Array.isArray(dataflowsValue)
        ? dataflowsValue
        : [dataflowsValue];

  return dataflows.map((raw) => {
    const flow = asRecord(raw);
    const name = asRecord(flow?.Name);
    return {
      id: asString(flow?.['@_id']),
      agencyId: asString(flow?.['@_agencyID']),
      version: asString(flow?.['@_version']),
      title: asString(name?.['#text']),
    };
  });
}
