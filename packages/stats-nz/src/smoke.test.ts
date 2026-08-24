import { describe, expect, it } from 'vitest';

import { createStatsNzClient } from './client';

const runSmoke = process.env.RUN_SMOKE === '1';

describe.runIf(runSmoke)('Stats NZ live API smoke', () => {
  const client = createStatsNzClient();

  it('fetches the national sheep series from the live API', async () => {
    const rows = await client.getData({ dataflowId: 'AGR_AGR_003', format: 'csv' });
    const sheep2024 = rows.find(
      (row) =>
        row.dimensions.LIVESTOCK === '6731' &&
        row.dimensions.AREA === '20' &&
        row.dimensions.YEAR === '2024',
    );
    expect(sheep2024?.value).toBeDefined();
    expect(sheep2024?.value).toBeGreaterThan(20000000);
    expect(sheep2024?.value).toBeLessThan(27000000);
  });

  it('lists the live dataflow catalogue', async () => {
    const flows = await client.getDataflowCatalogue();
    expect(flows.length).toBeGreaterThan(500);
    expect(flows.some((flow) => flow.id === 'AGR_AGR_003')).toBe(true);
  });
});
