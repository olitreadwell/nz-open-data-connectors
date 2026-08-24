import { parseDataflowCatalogueXml } from "./catalogue";
import { parseCodelistXml } from "./codelist";
import { parseStatsNzCsv } from "./csv";
import { StatsNzApiError, StatsNzError } from "./errors";
import { parseSdmxJsonResponse } from "./sdmxJson";
import type {
  StatsNzClient,
  StatsNzClientOptions,
  StatsNzCodelist,
  StatsNzDataflow,
  StatsNzDataFormat,
  StatsNzGetDataRequest,
  StatsNzObservation,
} from "./types";

const DEFAULT_BASE_URL = "https://api.data.stats.govt.nz/rest";
// Every dataflow in the current ADE catalogue is published at version 1.0
// (verified against the live catalogue), and the keyless access path requires
// an explicit version. Callers with a subscription key can pass `latest`.
const DEFAULT_VERSION = "1.0";
const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = "nz-open-data-connectors/0.1.0 (Language=TypeScript)";
const VALID_FORMATS: StatsNzDataFormat[] = [
  "csv",
  "csvfilewithlabels",
  "jsondata",
];

/**
 * Creates a Stats NZ (ADE) API client.
 * @param options - optional base URL, subscription key, fetch impl, and timeout
 * @returns A client with catalogue, data, and codelist methods
 */
export function createStatsNzClient(
  options: StatsNzClientOptions = {},
): StatsNzClient {
  let baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  while (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  const subscriptionKey = options.subscriptionKey;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function sendRequest(path: string, accept: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: accept,
      "Cache-Control": "no-cache",
      "user-agent": USER_AGENT,
    };
    if (subscriptionKey !== undefined) {
      headers["Ocp-Apim-Subscription-Key"] = subscriptionKey;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${baseUrl}${path}`;
    try {
      return await fetchImpl(url, {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new StatsNzApiError(
          `Stats NZ request timed out after ${timeoutMs}ms`,
          {
            status: 0,
            retryable: true,
            url,
          },
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function toApiError(
    response: Response,
    url: string,
  ): Promise<StatsNzApiError> {
    let message = `Stats NZ API request failed with status ${response.status}`;
    let body: { message?: unknown } | undefined;
    try {
      body = (await response.json()) as { message?: unknown };
    } catch {
      body = undefined;
    }
    if (typeof body?.message === "string" && body.message.length > 0) {
      message = body.message;
    }
    return new StatsNzApiError(message, {
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
      url,
    });
  }

  async function getData(
    request: StatsNzGetDataRequest,
  ): Promise<StatsNzObservation[]> {
    const format = request.format ?? "csv";
    if (!VALID_FORMATS.includes(format)) {
      throw new StatsNzError(`Unsupported Stats NZ response format: ${format}`);
    }
    const version = request.version ?? DEFAULT_VERSION;
    const versionSegment = `,${encodeURIComponent(version)}`;
    const path = `/data/STATSNZ,${encodeURIComponent(request.dataflowId)}${versionSegment}/${encodeURIComponent(request.key ?? "all")}?format=${format}`;
    const accept = format === "jsondata" ? "application/json" : "text/csv";

    const response = await sendRequest(path, accept);
    if (!response.ok) {
      throw await toApiError(response, `${baseUrl}${path}`);
    }

    const text = await response.text();
    if (format === "jsondata") {
      return parseSdmxJsonResponse(text);
    }
    return parseStatsNzCsv(text, { dataflowId: request.dataflowId });
  }

  async function getDataflowCatalogue(): Promise<StatsNzDataflow[]> {
    const path = "/dataflow/STATSNZ/all";
    const response = await sendRequest(path, "application/xml");
    if (!response.ok) {
      throw await toApiError(response, `${baseUrl}${path}`);
    }
    return parseDataflowCatalogueXml(await response.text());
  }

  async function getCodelist(
    codelistId: string,
    options: { version?: string } = {},
  ): Promise<StatsNzCodelist> {
    const versionSegment =
      options.version === undefined
        ? ""
        : `/${encodeURIComponent(options.version)}`;
    const path = `/codelist/STATSNZ/${encodeURIComponent(codelistId)}${versionSegment}`;
    const response = await sendRequest(path, "application/xml");
    if (!response.ok) {
      throw await toApiError(response, `${baseUrl}${path}`);
    }
    return parseCodelistXml(await response.text());
  }

  return {
    getDataflowCatalogue,
    getData,
    getCodelist,
  };
}
