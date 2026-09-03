import { describe, expect, it } from 'vitest';

import { createErrorTracker } from './errorTracking';

describe('createErrorTracker', () => {
  it('is a no-op when no DSN is configured', () => {
    const tracker = createErrorTracker(undefined);

    const report = (): void => {
      tracker.report(new Error('boom'), { path: '/health' });
    };
    expect(report).not.toThrow();
  });

  it('ignores empty-string DSNs', () => {
    const tracker = createErrorTracker('');

    const report = (): void => {
      tracker.report('not even an error', { path: '/x' });
    };
    expect(report).not.toThrow();
  });
});
