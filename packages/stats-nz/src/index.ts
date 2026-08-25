/** Public surface of the Stats NZ client package. */
export { createStatsNzClient } from "./client";
export { parseStatsNzCsv, serializeStatsNzRowsToCsv } from "./csv";
export { StatsNzApiError, StatsNzError, StatsNzParseError } from "./errors";
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
} from "./types";
