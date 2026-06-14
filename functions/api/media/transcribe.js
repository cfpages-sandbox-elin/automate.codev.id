async function proxyToOracle(context, options) {
  const baseUrl = context.env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = context.env.ORACLE_BACKEND_PROXY_SECRET;
  if (!token) {
    return Response.json({ ok: false, status: 500, message: 'Cloudflare Pages backend secret is missing.' }, { status: 500 });
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  let body;
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
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { message: raw };
  }
  return Response.json(data, { status: upstream.ok ? 200 : 502 });
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export const onRequestPost = async (context) => proxyToOracle(context, { path: '/nca/media/transcribe', method: 'POST', body: await readJsonBody(context.request) });
