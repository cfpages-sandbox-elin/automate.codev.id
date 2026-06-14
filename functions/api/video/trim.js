async function proxyToOracle(context, options) {
  const env = context.env || {};
  const baseUrl = env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = env.ORACLE_BACKEND_PROXY_SECRET || env.CODEV_API_PROXY_TOKEN;
  if (!token) {
    return Response.json({ ok: false, status: 500, message: 'Cloudflare Pages backend secret is missing.' }, { status: 500 });
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  let body;
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  let upstream;
  try {
    upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}${options.path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      status: 502,
      message: 'Could not reach Oracle backend from Cloudflare Pages Function.',
      error: error instanceof Error ? error.message : 'unknown fetch error',
      target: `${baseUrl.replace(/\/+$/, '')}${options.path}`,
    }, { status: 200 });
  }
  const raw = await upstream.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { message: raw };
  }
  return Response.json(data, { status: 200 });
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export const onRequestPost = async (context) => proxyToOracle(context, { path: '/nca/video/trim', method: 'POST', body: await readJsonBody(context.request) });
