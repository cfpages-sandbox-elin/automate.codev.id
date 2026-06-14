export type ToolkitClientOptions = {
  baseUrl: string;
  apiKey: string;
  fetcher?: typeof fetch;
};

export type ToolkitResult = {
  ok: boolean;
  status: number;
  message: string;
  endpoint?: string;
  resultUrl?: string;
  raw?: unknown;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function readStringField(value: unknown, field: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return typeof record[field] === 'string' ? record[field] : undefined;
}

function readNumberField(value: unknown, field: string): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return typeof record[field] === 'number' ? record[field] : undefined;
}

async function callToolkit(path: string, options: ToolkitClientOptions): Promise<ToolkitResult> {
  const fetcher = options.fetcher ?? fetch;
  const url = `${normalizeBaseUrl(options.baseUrl)}${path}`;
  try {
    const response = await fetcher(url, {
      method: 'GET',
      headers: { 'X-API-Key': options.apiKey },
      cache: 'no-store',
    });
    const raw = await parseJsonSafely(response);
    const code = readNumberField(raw, 'code') ?? response.status;
    const message = readStringField(raw, 'message') ?? (response.ok ? 'success' : 'request failed');
    const endpoint = readStringField(raw, 'endpoint');
    const resultUrl = readStringField(raw, 'response');
    return {
      ok: response.ok && code >= 200 && code < 300,
      status: response.status,
      message,
      endpoint,
      resultUrl,
      raw,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown toolkit error';
    return { ok: false, status: 0, message };
  }
}

export async function getToolkitHealth(options: ToolkitClientOptions): Promise<ToolkitResult> {
  return callToolkit('/authenticate', options);
}

export async function runToolkitInstallTest(options: ToolkitClientOptions): Promise<ToolkitResult> {
  return callToolkit('/v1/toolkit/test', options);
}

export function getToolkitConfigFromEnv(): ToolkitClientOptions {
  const baseUrl = process.env.TOOLKIT_INTERNAL_URL;
  const apiKey = process.env.TOOLKIT_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('Toolkit server config is missing. Check TOOLKIT_INTERNAL_URL and TOOLKIT_API_KEY.');
  }
  return { baseUrl, apiKey };
}
