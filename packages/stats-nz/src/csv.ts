import { StatsNzParseError } from "./errors";
import type { StatsNzObservation } from "./types";

/** Parses ADE CSV text into rows of column-name to value mappings.
 * @param text - raw CSV payload
 * @returns rows keyed by column name
 */
export function parseCsv(text: string): Array<Record<string, string>> {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (normalized.trim() === "") {
    return [];
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index];
    if (char === undefined) {
      break;
    }
    if (inQuotes) {
      if (char === '"') {
        if (normalized[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      index += 1;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += 1;
      continue;
    }
    field += char;
    index += 1;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows[0];
  if (header === undefined) {
    return [];
  }

  return rows.slice(1).map((values) => {
    if (values.length > header.length) {
      throw new StatsNzParseError(
        "CSV row has more fields than the header row",
      );
    }
    const record: Record<string, string> = {};
    header.forEach((name, columnIndex) => {
      record[name] = values[columnIndex] ?? "";
    });
    return record;
  });
}

export interface StatsNzCsvParseOptions {
  dataflowId: string;
}

export function parseStatsNzCsv(
  text: string,
  options: StatsNzCsvParseOptions,
): StatsNzObservation[] {
  const records = parseCsv(text);
  if (records.length === 0) {
    return [];
  }

  const firstRecord = records[0];
  if (
    firstRecord === undefined ||
    !Object.keys(firstRecord).includes("OBS_VALUE")
  ) {
    throw new StatsNzParseError("Stats NZ CSV is missing the OBS_VALUE column");
  }

  const suffix = `_${options.dataflowId}`;
  const labelSuffix = `_LABEL${suffix}`;
  const observations: StatsNzObservation[] = [];

  for (const record of records) {
    const dimensions: Record<string, string> = {};
    const labels: Record<string, string> = {};

    for (const key of Object.keys(record)) {
      if (key === "DATAFLOW" || key === "OBS_VALUE" || key === "OBS_STATUS") {
        continue;
      }
      if (key.endsWith(labelSuffix)) {
        labels[key.slice(0, -labelSuffix.length)] = record[key] ?? "";
        continue;
      }
      if (key.endsWith(suffix)) {
        dimensions[key.slice(0, -suffix.length)] = record[key] ?? "";
      }
    }

    const rawValue = record.OBS_VALUE ?? "";
    const value = rawValue === "" ? null : Number(rawValue);
    if (value !== null && !Number.isFinite(value)) {
      throw new StatsNzParseError(
        `Invalid OBS_VALUE in Stats NZ CSV: ${rawValue}`,
      );
    }

    const status = (record.OBS_STATUS ?? "").trim();
    const observation: StatsNzObservation = { dimensions, value };
    if (Object.keys(labels).length > 0) {
      observation.labels = labels;
    }
    if (status !== "") {
      observation.status = status;
    }
    observations.push(observation);
  }

  return observations;
}

/** Serializes typed observations back to CSV (dimension columns, then value, then status). */
export function serializeStatsNzRowsToCsv(rows: StatsNzObservation[]): string {
  if (rows.length === 0) {
    return "";
  }
  const dimensionKeys = [
    ...new Set(rows.flatMap((row) => Object.keys(row.dimensions))),
  ].sort();
  const hasStatus = rows.some((row) => row.status !== undefined);
  const header = [...dimensionKeys, "value", ...(hasStatus ? ["status"] : [])];
  const lines = rows.map((row) => {
    const cells = [
      ...dimensionKeys.map((key) => row.dimensions[key] ?? ""),
      row.value === null ? "" : String(row.value),
      ...(hasStatus ? [row.status ?? ""] : []),
    ];
    return cells.map(escapeCsvCell).join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
