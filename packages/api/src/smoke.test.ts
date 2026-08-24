import { describe, expect, it } from 'vitest';

import { createConnectorsApp } from './index';

const RUN_SMOKE = process.env.RUN_SMOKE === '1';

describe.skipIf(!RUN_SMOKE)('live API smoke test', () => {
  it('lists every source through the API', async () => {
    const app = createConnectorsApp({});
    const res = await app.request('/api/sources');
    expect(res.status).toBe(200);
    const sources = (await res.json()) as Array<{ id: string }>;
    expect(sources.length).toBeGreaterThanOrEqual(8);
  });

  it('pulls the catalogue and agriculture data keyless', async () => {
    const app = createConnectorsApp({});
    const catalogue = await app.request('/api/stats-nz/catalogue');
    expect(catalogue.status).toBe(200);
    const data = await app.request('/api/stats-nz/data?dataflowId=AGR_AGR_003');
    expect(data.status).toBe(200);
    const body = (await data.json()) as { rows: Array<unknown> };
    expect(body.rows.length).toBeGreaterThan(0);
  });

  it('probes keyed sources when keys are present', async () => {
    const apiKeys: Record<string, string> = {};
    if (process.env.LINZ_API_KEY !== undefined) {
      apiKeys.linz = process.env.LINZ_API_KEY;
    }
    if (process.env.DIGITAL_NZ_API_KEY !== undefined) {
      apiKeys.digitalnz = process.env.DIGITAL_NZ_API_KEY;
    }
    const app = createConnectorsApp({ apiKeys });
    for (const id of Object.keys(apiKeys)) {
      const res = await app.request(`/api/sources/${id}/probe`);
      expect(res.status).toBe(200);
      const probe = (await res.json()) as { ok: boolean; status: string };
      expect(probe.ok, `${id}: ${probe.status}`).toBe(true);
    }
  });
});
