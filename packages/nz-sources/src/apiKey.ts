/**
 * Normalizes an optional API key read from configuration or a caller.
 *
 * An environment variable that is set but empty (`LINZ_API_KEY=`) is treated
 * as absent. A blank key must never reach a request: DigitalNZ answers HTTP
 * 403 `Invalid API Key` when it receives `api_key=`.
 *
 * @param key - The raw key, or undefined when unset.
 * @returns The trimmed key, or undefined when it is blank.
 */
export function normalizeSourceApiKey(key: string | undefined): string | undefined {
  const trimmed = key?.trim();
  if (trimmed === undefined || trimmed === '') {
    return undefined;
  }
  return trimmed;
}
