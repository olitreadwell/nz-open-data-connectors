import { describe, expectTypeOf, it } from 'vitest';
import type { NzSourceLicense } from '@nz-open-data-connectors/nz-sources';

import type { SourceLicense, SourceSummary } from './index.js';

describe('MCP public types', () => {
  it('uses the shared source licence type', () => {
    expectTypeOf<SourceLicense>().toEqualTypeOf<NzSourceLicense>();
    expectTypeOf<SourceSummary['license']>().toEqualTypeOf<SourceLicense | undefined>();
  });
});
