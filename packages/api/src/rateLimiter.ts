import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context, MiddlewareHandler } from 'hono';

/**
 * Options for the in-memory per-IP rate limiter.
 * The limiter is process-local: multi-instance deployments must enforce
 * request limits at a shared proxy or gateway instead.
 */
export interface RateLimiterOptions {
  /** Maximum requests allowed per window. */
  maxRequests: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Default limit: 60 requests per minute per client. */
export const DEFAULT_RATE_LIMIT_OPTIONS: RateLimiterOptions = {
  maxRequests: 60,
  windowMs: 60_000,
};

/** Tracks one fixed window of requests for a single client IP. */
interface RateLimitWindow {
  startedAtMs: number;
  count: number;
}

/**
 * Resolves the client IP for one request.
 *
 * Trusts the first X-Forwarded-For entry when present (set by the proxy you
 * control), then falls back to the socket address, then to "unknown" for
 * in-process calls. A client that can reach the app directly can spoof the
 * header, so production deployments should overwrite it at a trusted proxy
 * or enforce limits there.
 *
 * @param c - The Hono request context.
 * @returns The client IP string.
 */
export function resolveClientIp(c: Context): string {
  const forwardedFor = c.req.header('x-forwarded-for');
  if (forwardedFor !== undefined) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp !== undefined && firstIp !== '') {
      return firstIp;
    }
  }
  try {
    const address = getConnInfo(c).remote.address;
    if (address !== undefined && address !== '') {
      return address;
    }
  } catch {
    // No socket information (for example in-process app.request() tests).
  }
  return 'unknown';
}

/**
 * Creates a fixed-window, in-memory rate limiter middleware.
 *
 * Counters live in process memory and reset on restart, so this guards a
 * single instance only. Multi-instance deployments must rate limit at a
 * shared proxy or gateway.
 *
 * @param options - Budget per window.
 * @returns Middleware that answers 429 with a Retry-After header when a
 *   client exceeds the budget.
 */
export function createRateLimiter(options: RateLimiterOptions): MiddlewareHandler {
  const windows = new Map<string, RateLimitWindow>();
  return async (c, next) => {
    const clientIp = resolveClientIp(c);
    const nowMs = Date.now();
    const window = windows.get(clientIp);
    if (window === undefined || nowMs - window.startedAtMs >= options.windowMs) {
      if (window === undefined) {
        purgeExpiredWindows(windows, options.windowMs, nowMs);
      }
      windows.set(clientIp, { startedAtMs: nowMs, count: 1 });
      await next();
      return;
    }
    if (window.count >= options.maxRequests) {
      c.header('Retry-After', String(Math.ceil(options.windowMs / 1000)));
      return c.json({ error: 'rate_limited' }, 429);
    }
    window.count += 1;
    await next();
    return;
  };
}

/**
 * Drops windows whose time slice has already ended.
 *
 * @param windows - The live window map.
 * @param windowMs - Window length in milliseconds.
 * @param nowMs - Current time in milliseconds.
 */
function purgeExpiredWindows(
  windows: Map<string, RateLimitWindow>,
  windowMs: number,
  nowMs: number
): void {
  for (const [ip, window] of windows) {
    if (nowMs - window.startedAtMs >= windowMs) {
      windows.delete(ip);
    }
  }
}
