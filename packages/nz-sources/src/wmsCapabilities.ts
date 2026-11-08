import { XMLParser } from 'fast-xml-parser';

import { NzSourceParseError } from './errors.js';

/** Geographic bounds declared by a WMS layer, in WGS 84 degrees. */
export interface WmsGeographicBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

/** One named layer advertised by a WMS GetCapabilities response. */
export interface WmsLayer {
  name: string;
  title: string;
  abstract: string;
  queryable: boolean;
  crs: string[];
  geographicBounds: WmsGeographicBounds | null;
}

/** Service metadata and named layers from a WMS 1.3.0 capabilities document. */
export interface WmsCapabilities {
  version: string;
  serviceTitle: string;
  serviceAbstract: string;
  layers: WmsLayer[];
}

const WMS_XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

/** Tests whether an unknown value is a plain record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads an XML text node as a string, treating an absent node as empty. */
function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Normalizes a repeated XML node to an array. */
function asArray(value: unknown): unknown[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/** Reads a required finite number from a WMS XML node. */
function readNumber(value: unknown, field: string, source: string): number {
  const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    throw new NzSourceParseError(source, `invalid ${field} in WMS capabilities`);
  }
  return parsed;
}

/** Reads a layer's declared CRS list without inheriting from its parent. */
function readCrs(layer: Record<string, unknown>): string[] {
  return asArray(layer.CRS)
    .map((value) => readString(value))
    .filter((value) => value.length > 0);
}

/** Reads a layer's declared geographic bounds, or null when it has none. */
function readGeographicBounds(
  layer: Record<string, unknown>,
  source: string
): WmsGeographicBounds | null {
  const bounds = layer.EX_GeographicBoundingBox;
  if (bounds === undefined) {
    return null;
  }
  if (!isRecord(bounds)) {
    throw new NzSourceParseError(source, 'invalid EX_GeographicBoundingBox in WMS capabilities');
  }
  return {
    west: readNumber(bounds.westBoundLongitude, 'westBoundLongitude', source),
    east: readNumber(bounds.eastBoundLongitude, 'eastBoundLongitude', source),
    south: readNumber(bounds.southBoundLatitude, 'southBoundLatitude', source),
    north: readNumber(bounds.northBoundLatitude, 'northBoundLatitude', source),
  };
}

/**
 * Parses a WMS 1.3.0 GetCapabilities response into service metadata and named
 * layers. CRS codes and bounds are the ones declared on each layer; they are
 * not inherited from a parent layer.
 *
 * @param payload - Raw XML from a WMS GetCapabilities request.
 * @param source - Source name used in parse errors, e.g. "LRIS basemaps".
 * @returns Service metadata and the flattened list of named layers.
 */
export function parseWmsCapabilities(payload: string, source: string): WmsCapabilities {
  const parsed: unknown = WMS_XML_PARSER.parse(payload);
  if (!isRecord(parsed)) {
    throw new NzSourceParseError(source, 'invalid WMS capabilities XML');
  }
  const root = parsed.WMS_Capabilities;
  if (!isRecord(root)) {
    throw new NzSourceParseError(source, 'missing WMS_Capabilities root element');
  }
  const version = readString(root['@_version']);
  if (version !== '1.3.0') {
    throw new NzSourceParseError(source, `unsupported WMS version "${version}"`);
  }
  const service = root.Service;
  if (!isRecord(service)) {
    throw new NzSourceParseError(source, 'missing WMS Service element');
  }
  const capability = root.Capability;
  if (!isRecord(capability)) {
    throw new NzSourceParseError(source, 'missing WMS Capability element');
  }
  const rootLayer = capability.Layer;
  if (!isRecord(rootLayer)) {
    throw new NzSourceParseError(source, 'missing WMS Capability/Layer element');
  }
  const layers: WmsLayer[] = [];
  const visit = (layer: Record<string, unknown>): void => {
    const name = readString(layer.Name);
    if (name.length > 0) {
      layers.push({
        name,
        title: readString(layer.Title),
        abstract: readString(layer.Abstract),
        queryable: readString(layer['@_queryable']) === '1',
        crs: readCrs(layer),
        geographicBounds: readGeographicBounds(layer, source),
      });
    }
    for (const child of asArray(layer.Layer)) {
      if (isRecord(child)) {
        visit(child);
      } else {
        throw new NzSourceParseError(source, 'invalid nested WMS Layer element');
      }
    }
  };
  visit(rootLayer);
  return {
    version,
    serviceTitle: readString(service.Title),
    serviceAbstract: readString(service.Abstract),
    layers,
  };
}
