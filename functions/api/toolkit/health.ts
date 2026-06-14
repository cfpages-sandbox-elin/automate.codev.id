type Env = {
  ORACLE_BACKEND_BASE_URL: string;
  ORACLE_BACKEND_PROXY_SECRET: string;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return proxyToOracle(context, '/nca/toolkit/health');
};

async function proxyToOracle(context: EventContext<Env, string, unknown>, path: string): Promise<Response> {
  const baseUrl = context.env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = context.env.ORACLE_BACKEND_PROXY_SECRET;
  if (!token) {
    return Response.json({ ok: false, status: 500, message: 'Cloudflare Pages backend secret is missing.' }, { status: 500 });
  }
  const upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const raw = await upstream.text();
  let data: unknown;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw }; }
  const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  return Response.json({
    ok: upstream.ok,
    status: upstream.status,
    message: typeof record.message === 'string' ? record.message : (upstream.ok ? 'success' : 'request failed'),
    endpoint: typeof record.endpoint === 'string' ? record.endpoint : undefined,
    resultUrl: typeof record.response === 'string' && record.response.startsWith('http') ? record.response : undefined,
  }, { status: upstream.ok ? 200 : 502 });
}
