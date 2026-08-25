import * as Sentry from "@sentry/node";

/** Reports errors to an external tracker. */
export interface ErrorTracker {
  report(error: unknown, context: { path: string }): void;
}

/** Creates a tracker. Without a DSN it is a no-op, so Sentry stays off by default. */
export function createErrorTracker(dsn: string | undefined): ErrorTracker {
  if (dsn === undefined || dsn === "") {
    return { report: () => undefined };
  }
  Sentry.init({ dsn, tracesSampleRate: 0 });
  return {
    report: (error, context) => {
      Sentry.captureException(error, { extra: context });
    },
  };
}
