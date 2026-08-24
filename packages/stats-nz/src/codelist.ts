import { XMLParser } from "fast-xml-parser";

import { StatsNzParseError } from "./errors";
import type { StatsNzCodelist, StatsNzCodelistItem } from "./types";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toItems(codesValue: unknown): StatsNzCodelistItem[] {
  const codes = Array.isArray(codesValue)
    ? codesValue
    : codesValue === undefined
      ? []
      : [codesValue];
  return codes.map((raw) => {
    const code = asRecord(raw);
    const name = asRecord(code?.Name);
    return {
      id: asString(code?.["@_id"]),
      name: asString(name?.["#text"]),
    };
  });
}

export function parseCodelistXml(xml: string): StatsNzCodelist {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    processEntities: false,
  });

  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch {
    throw new StatsNzParseError("Failed to parse Stats NZ codelist XML");
  }

  const codelistsValue = asRecord(
    asRecord(asRecord(asRecord(doc)?.Structure)?.Structures)?.Codelists,
  )?.Codelist;
  const codelists =
    codelistsValue === undefined
      ? []
      : Array.isArray(codelistsValue)
        ? codelistsValue
        : [codelistsValue];
  const codelist = asRecord(codelists[0]);
  if (codelist === undefined) {
    throw new StatsNzParseError(
      "Stats NZ codelist XML has no Codelist element",
    );
  }

  return {
    id: asString(codelist["@_id"]),
    agencyId: asString(codelist["@_agencyID"]),
    version: asString(codelist["@_version"]),
    items: toItems(codelist.Code),
  };
}
