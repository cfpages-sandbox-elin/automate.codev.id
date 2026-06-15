import { requireAdmin } from '../../_auth.js';
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

function sanitizeYoutubeCookies(value) {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, 180000);
  if (!cleaned) return undefined;
  const lines = cleaned.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
  const valid = lines.some((line) => {
    const domain = line.split('\t')[0] || '';
    return line.split('\t').length >= 7 && /(^|\.)youtube\.com$|(^|\.)google\.com$|(^|\.)googlevideo\.com$/i.test(domain);
  });
  return valid ? cleaned : undefined;
}

function prepareDownloadBody(body) {
  const prepared = { ...body };
  const cookies = sanitizeYoutubeCookies(prepared.youtube_cookies) || sanitizeYoutubeCookies(prepared.cookie);
  delete prepared.youtube_cookies;
  if (cookies) prepared.cookie = cookies;
  else delete prepared.cookie;
  return prepared;
}

export const onRequestPost = async (context) => {
  const auth = await requireAdmin(context);
  if (auth) return auth;
  return proxyToOracle(context, { path: '/nca/media/download', method: 'POST', body: prepareDownloadBody(await readJsonBody(context.request)) });
};
