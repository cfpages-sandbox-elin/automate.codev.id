export type OracleProxyEnv = {
  ORACLE_BACKEND_BASE_URL?: string;
  ORACLE_BACKEND_PROXY_SECRET?: string;
};

type ProxyOptions = {
  path: string;
  method?: string;
  body?: unknown;
};

export async function proxyToOracle(context: EventContext<OracleProxyEnv, string, unknown>, options: ProxyOptions): Promise<Response> {
  const baseUrl = context.env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = context.env.ORACLE_BACKEND_PROXY_SECRET;

  if (!token) {
    return Response.json({ ok: false, status: 500, message: 'Cloudflare Pages backend secret is missing.' }, { status: 500 });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}${options.path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  });

  const raw = await upstream.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { message: raw };
  }

  return Response.json(data, { status: upstream.ok ? 200 : 502 });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
