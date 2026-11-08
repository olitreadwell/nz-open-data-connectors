import { request as httpsRequest } from 'node:https';

/**
 * Builds a fetch-compatible GET that uses HTTP/1.1. A few public hosts close
 * HTTP/2 streams from Node's built-in fetch with NGHTTP2_PROTOCOL_ERROR while
 * still answering HTTP/1.1 clients, so an adapter can pass this through
 * `httpGet`'s `fetchImpl` option and keep the shared timeout and error
 * mapping.
 *
 * @returns A fetch implementation for HTTP/1.1 GET requests.
 */
export function createHttp1Fetch(): typeof globalThis.fetch {
  const fetchImpl = (async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const requestHeaders = (init?.headers ?? {}) as Record<string, string>;
    const headers: Record<string, string> = {
      ...requestHeaders,
      'accept-encoding': 'identity',
    };
    const method = init?.method ?? 'GET';
    const signal = init?.signal ?? undefined;
    return await new Promise<Response>((resolve, reject) => {
      const request = httpsRequest(url, { method, headers }, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('error', reject);
        response.on('end', () => {
          const status = response.statusCode;
          if (status === undefined) {
            reject(new Error('HTTP/1.1 response has no status code'));
            return;
          }
          const responseHeaders = new Headers();
          for (const [name, value] of Object.entries(response.headers)) {
            if (Array.isArray(value)) {
              for (const entry of value) {
                responseHeaders.append(name, entry);
              }
            } else if (value !== undefined) {
              responseHeaders.set(name, value);
            }
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status,
              headers: responseHeaders,
            })
          );
        });
      });
      request.on('error', reject);
      if (signal !== undefined) {
        if (signal.aborted) {
          request.destroy(new Error('request aborted'));
          return;
        }
        signal.addEventListener('abort', () => request.destroy(new Error('request aborted')), {
          once: true,
        });
      }
      request.end();
    });
  }) as typeof globalThis.fetch;
  return fetchImpl;
}
