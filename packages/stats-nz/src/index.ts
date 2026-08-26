/** Public surface of the Stats NZ client package. */
export { createStatsNzClient } from "./client.js";
export { parseStatsNzCsv, serializeStatsNzRowsToCsv } from "./csv.js";
export { StatsNzApiError, StatsNzError, StatsNzParseError } from "./errors.js";
/** Shared types for the Stats NZ client. */
export type {
  StatsNzCodelist,
  StatsNzCodelistItem,
  StatsNzClient,
  StatsNzClientOptions,
  StatsNzDataFormat,
  StatsNzDataflow,
  StatsNzGetDataRequest,
  StatsNzObservation,
} from "./types.js";
