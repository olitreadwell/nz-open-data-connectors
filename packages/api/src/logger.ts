import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';

/** Writes one log line. Injectable so tests can capture output. */
export type LogWrite = (line: string) => void;

/** Writes a log line to stdout, one line per event. */
export const defaultLogWrite: LogWrite = (line: string) => {
  process.stdout.write(`${line}\n`);
};

/** Serializes one structured event as a single JSON line. */
export function writeLogEvent(
  event: Record<string, unknown>,
  write: LogWrite = defaultLogWrite
): void {
  write(JSON.stringify(event));
}

/** Logs every request as a JSON event with method, route, status, and duration. */
export function createRequestLogger(write: LogWrite = defaultLogWrite): MiddlewareHandler {
  return async (c, next) => {
    const startedAtMs = Date.now();
    await next();
    writeLogEvent(
      {
        ts: new Date().toISOString(),
        level: c.res.status >= 500 ? 'error' : 'info',
        event: 'http_request',
        method: c.req.method,
        path: c.req.path,
        route: routePath(c, -1),
        status: c.res.status,
        duration_ms: Date.now() - startedAtMs,
      },
      write
    );
  };
}
