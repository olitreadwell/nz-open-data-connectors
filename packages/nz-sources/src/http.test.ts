import { describe, expect, it } from 'vitest';

import { NzSourceApiError } from './errors.js';
import { DEFAULT_TIMEOUT_MS, httpGet, httpPost, USER_AGENT } from './http.js';

/** A fetch stub that records the init it was called with. */
function recordingFetch(response: () => Response): {
  impl: typeof globalThis.fetch;
  calls: RequestInit[];
} {
  const calls: RequestInit[] = [];
  const impl: typeof globalThis.fetch = async (_input, init) => {
    calls.push(init ?? {});
    return response();
  };
  return { impl, calls };
}

/** Headers from the first recorded call, as a plain lookup map. */
function headersOf(calls: RequestInit[]): Record<string, string> {
  return (calls[0]?.headers ?? {}) as Record<string, string>;
}

const URL_UNDER_TEST = 'https://example.govt.nz/api';

describe('httpGet', () => {
  it('identifies the client with a user agent', async () => {
    const { impl, calls } = recordingFetch(() => new Response('{}', { status: 200 }));
    await httpGet('Test source', URL_UNDER_TEST, { fetchImpl: impl });
    expect(headersOf(calls)['user-agent']).toBe(USER_AGENT);
  });

  it('merges caller headers over the defaults', async () => {
    const { impl, calls } = recordingFetch(() => new Response('{}', { status: 200 }));
    await httpGet('Test source', URL_UNDER_TEST, {
      fetchImpl: impl,
      headers: { Accept: 'application/json' },
    });
    const headers = headersOf(calls);
    expect(headers['user-agent']).toBe(USER_AGENT);
    expect(headers.Accept).toBe('application/json');
  });

  it('drops credentials when a redirect changes origin', async () => {
    const calls: { url: string; headers: Headers }[] = [];
    const impl: typeof globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      calls.push({ url, headers: new Headers(init?.headers) });
      if (calls.length === 1) {
        return new Response('', {
          status: 302,
          headers: { location: 'https://other.example/final' },
        });
      }
      return new Response('ok', { status: 200 });
    };

    await httpGet('Test source', URL_UNDER_TEST, {
      fetchImpl: impl,
      headers: {
        authorization: 'Bearer secret',
        'x-api-key': 'key',
        'x-auth-key': 'auth-key',
        Accept: 'application/json',
      },
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]?.headers.get('x-api-key')).toBe('key');
    expect(calls[1]?.headers.get('authorization')).toBeNull();
    expect(calls[1]?.headers.get('x-api-key')).toBeNull();
    expect(calls[1]?.headers.get('x-auth-key')).toBeNull();
    expect(calls[1]?.headers.get('accept')).toBe('application/json');
  });

  it('keeps credentials when a redirect stays on the same origin', async () => {
    const credentials: Array<string | null> = [];
    const impl: typeof globalThis.fetch = async (_input, init) => {
      credentials.push(new Headers(init?.headers).get('x-api-key'));
      if (credentials.length === 1) {
        return new Response('', { status: 302, headers: { location: '/final' } });
      }
      return new Response('ok', { status: 200 });
    };

    await httpGet('Test source', URL_UNDER_TEST, {
      fetchImpl: impl,
      headers: { 'x-api-key': 'key' },
    });

    expect(credentials).toEqual(['key', 'key']);
  });

  it('returns the response when the status is ok', async () => {
    const { impl } = recordingFetch(() => new Response('hello', { status: 200 }));
    const response = await httpGet('Test source', URL_UNDER_TEST, { fetchImpl: impl });
    expect(await response.text()).toBe('hello');
  });

  it('reports a 404 as not retryable, with the status', async () => {
    const { impl } = recordingFetch(() => new Response('gone', { status: 404 }));
    const failure = await httpGet('Test source', URL_UNDER_TEST, { fetchImpl: impl }).catch(
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(NzSourceApiError);
    expect((failure as NzSourceApiError).status).toBe(404);
    expect((failure as NzSourceApiError).retryable).toBe(false);
    expect((failure as NzSourceApiError).message).toBe('Test source: HTTP 404');
  });

  it('reports a 429 as retryable', async () => {
    const { impl } = recordingFetch(() => new Response('slow down', { status: 429 }));
    const failure = await httpGet('Test source', URL_UNDER_TEST, { fetchImpl: impl }).catch(
      (error: unknown) => error
    );
    expect((failure as NzSourceApiError).status).toBe(429);
    expect((failure as NzSourceApiError).retryable).toBe(true);
  });

  it('reports a 503 as retryable', async () => {
    const { impl } = recordingFetch(() => new Response('later', { status: 503 }));
    const failure = await httpGet('Test source', URL_UNDER_TEST, { fetchImpl: impl }).catch(
      (error: unknown) => error
    );
    expect((failure as NzSourceApiError).retryable).toBe(true);
  });

  it('reports a network failure as retryable', async () => {
    const impl: typeof globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };
    const failure = await httpGet('Test source', URL_UNDER_TEST, { fetchImpl: impl }).catch(
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(NzSourceApiError);
    expect((failure as NzSourceApiError).retryable).toBe(true);
  });

  it('aborts a request that outlives the timeout', async () => {
    const hangingFetch: typeof globalThis.fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const failure = await httpGet('Test source', URL_UNDER_TEST, {
      fetchImpl: hangingFetch,
      timeoutMs: 10,
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(NzSourceApiError);
    expect((failure as NzSourceApiError).message).toBe('Test source: request timed out after 10ms');
    expect((failure as NzSourceApiError).retryable).toBe(true);
  });

  it('defaults the timeout to 30 seconds', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });
});

describe('httpPost', () => {
  it('sends a form body with the shared user agent', async () => {
    const { impl, calls } = recordingFetch(() => new Response('ok', { status: 200 }));
    const body = new URLSearchParams({ query: 'employment' });
    await httpPost('Test source', URL_UNDER_TEST, body, { fetchImpl: impl });
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toBe(body);
    expect(headersOf(calls)['user-agent']).toBe(USER_AGENT);
  });

  it('merges caller headers over the defaults', async () => {
    const { impl, calls } = recordingFetch(() => new Response('ok', { status: 200 }));
    await httpPost('Test source', URL_UNDER_TEST, 'raw', {
      fetchImpl: impl,
      headers: { 'content-type': 'text/plain' },
    });
    const headers = headersOf(calls);
    expect(headers['user-agent']).toBe(USER_AGENT);
    expect(headers['content-type']).toBe('text/plain');
  });

  it('returns a manual redirect instead of following it', async () => {
    const { impl } = recordingFetch(
      () => new Response('', { status: 302, headers: { location: '/next' } })
    );
    const response = await httpPost('Test source', URL_UNDER_TEST, 'body', {
      fetchImpl: impl,
      redirect: 'manual',
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/next');
  });

  it('follows redirects by default', async () => {
    const { impl, calls } = recordingFetch(() => new Response('ok', { status: 200 }));
    await httpPost('Test source', URL_UNDER_TEST, 'body', { fetchImpl: impl });
    expect(calls[0]?.redirect).toBeUndefined();
  });

  it('reports a 500 as retryable', async () => {
    const { impl } = recordingFetch(() => new Response('later', { status: 500 }));
    const failure = await httpPost('Test source', URL_UNDER_TEST, 'body', {
      fetchImpl: impl,
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(NzSourceApiError);
    expect((failure as NzSourceApiError).retryable).toBe(true);
  });

  it('reports a network failure as retryable', async () => {
    const impl: typeof globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };
    const failure = await httpPost('Test source', URL_UNDER_TEST, 'body', {
      fetchImpl: impl,
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(NzSourceApiError);
    expect((failure as NzSourceApiError).retryable).toBe(true);
  });

  it('aborts a request that outlives the timeout', async () => {
    const hangingFetch: typeof globalThis.fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const failure = await httpPost('Test source', URL_UNDER_TEST, 'body', {
      fetchImpl: hangingFetch,
      timeoutMs: 10,
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(NzSourceApiError);
    expect((failure as NzSourceApiError).message).toBe('Test source: request timed out after 10ms');
  });
});
