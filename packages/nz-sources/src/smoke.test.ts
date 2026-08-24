import { describe, expect, it } from 'vitest';

import { probeAllNzDataSources } from './registry';

const RUN_SMOKE = process.env.RUN_SMOKE === '1';

/** Maps an env var to the adapter id that accepts it as an optional key. */
const OPTIONAL_KEY_SOURCE_ENV: Record<string, string> = {
  LINZ_API_KEY: 'linz',
  DIGITAL_NZ_API_KEY: 'digitalnz',
};

describe.skipIf(!RUN_SMOKE)('live access smoke test', () => {
  it('reaches every keyless source and verifies optional-key sources with keys', async () => {
    const apiKeys = Object.fromEntries(
      Object.entries(OPTIONAL_KEY_SOURCE_ENV)
        .filter(([envName]) => process.env[envName] !== undefined)
        .map(([envName, sourceId]) => [sourceId, process.env[envName] ?? '']),
    );
    const probes = await probeAllNzDataSources({
      ...(Object.keys(apiKeys).length > 0 ? { apiKeys } : {}),
    });
    for (const probe of probes) {
      expect(probe.ok, `${probe.name}: ${probe.status}`).toBe(true);
      if (apiKeys[probe.id] !== undefined) {
        expect(probe.ok, `${probe.name} (keyed): ${probe.status}`).toBe(true);
      }
    }
  });
});
