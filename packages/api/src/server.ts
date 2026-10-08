import { serve } from '@hono/node-server';

import { normalizeSourceApiKey } from '@nz-open-data-connectors/nz-sources';

import { createConnectorsApp } from './index';
import type { ConnectorsAppOptions } from './index';
import { DEFAULT_RATE_LIMIT_OPTIONS } from './rateLimiter';

/**
 * Parses an optional positive integer env var, falling back to the default.
 *
 * @param value - Raw env value, or undefined when unset.
 * @param fallback - Value used when unset or invalid.
 * @returns A positive integer.
 */
function parsePositiveIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

const port = Number(process.env.PORT ?? 8787);

const options: ConnectorsAppOptions = {};
const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (corsOrigin !== undefined && corsOrigin !== '') {
  options.corsOrigin = corsOrigin;
}
const statsNzSubscriptionKey = normalizeSourceApiKey(process.env.STATS_NZ_SUBSCRIPTION_KEY);
if (statsNzSubscriptionKey !== undefined) {
  options.statsNzSubscriptionKey = statsNzSubscriptionKey;
}
const sentryDsn = process.env.SENTRY_DSN?.trim();
if (sentryDsn !== undefined && sentryDsn !== '') {
  options.sentryDsn = sentryDsn;
}
const apiKeys: Record<string, string> = {};
const linzApiKey = normalizeSourceApiKey(process.env.LINZ_API_KEY);
if (linzApiKey !== undefined) {
  apiKeys.linz = linzApiKey;
}
const digitalNzApiKey = normalizeSourceApiKey(process.env.DIGITAL_NZ_API_KEY);
if (digitalNzApiKey !== undefined) {
  apiKeys.digitalnz = digitalNzApiKey;
}
if (Object.keys(apiKeys).length > 0) {
  options.apiKeys = apiKeys;
}
options.rateLimit = {
  maxRequests: parsePositiveIntEnv(
    process.env.RATE_LIMIT_MAX,
    DEFAULT_RATE_LIMIT_OPTIONS.maxRequests
  ),
  windowMs: parsePositiveIntEnv(
    process.env.RATE_LIMIT_WINDOW_MS,
    DEFAULT_RATE_LIMIT_OPTIONS.windowMs
  ),
};

const app = createConnectorsApp(options);

serve({ fetch: app.fetch, port }, (info) => {
  process.stdout.write(`NZ open data connectors listening on http://localhost:${info.port}\n`);
});
