import { describe, expect, it, vi } from 'vitest';
import { getToolkitHealth, runToolkitInstallTest } from './toolkit-client';

describe('toolkit client', () => {
  it('calls the toolkit authenticate endpoint with the API key server-side', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ code: 200, message: 'success', endpoint: '/authenticate' }), { status: 200 }),
    );

    const result = await getToolkitHealth({
      baseUrl: 'http://127.0.0.1:8088',
      apiKey: 'secret-key',
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8088/authenticate', {
      method: 'GET',
      headers: { 'X-API-Key': 'secret-key' },
      cache: 'no-store',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.message).toBe('success');
  });

  it('returns a safe failure shape without leaking the API key when the toolkit rejects a request', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ code: 401, message: 'Unauthorized' }), { status: 401 }),
    );

    const result = await getToolkitHealth({
      baseUrl: 'http://127.0.0.1:8088/',
      apiKey: 'super-secret-api-key',
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(JSON.stringify(result)).not.toContain('super-secret-api-key');
  });

  it('runs the install/R2 smoke test and returns the public result URL', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          code: 200,
          message: 'success',
          response: 'https://assets.automate.codev.id/success.txt',
        }),
        { status: 200 },
      ),
    );

    const result = await runToolkitInstallTest({
      baseUrl: 'http://127.0.0.1:8088',
      apiKey: 'secret-key',
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8088/v1/toolkit/test', {
      method: 'GET',
      headers: { 'X-API-Key': 'secret-key' },
      cache: 'no-store',
    });
    expect(result.ok).toBe(true);
    expect(result.resultUrl).toBe('https://assets.automate.codev.id/success.txt');
  });
});
