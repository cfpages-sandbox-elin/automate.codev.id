import { requireAdmin } from '../../../_auth.js';

async function proxyStatus(context, jobId) {
  const env = context.env || {};
  const baseUrl = env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = env.ORACLE_BACKEND_PROXY_SECRET || env.CODEV_API_PROXY_TOKEN;
  if (!token) {
    return Response.json({ code: 500, message: 'Backend secret is missing.' }, { status: 200 });
  }
  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    return Response.json({ code: 400, message: 'Missing or invalid job id.' }, { status: 200 });
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}/ai/clip-factory/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = await upstream.json().catch(async () => ({ message: await upstream.text().catch(() => '') }));
    return Response.json(data, { status: upstream.ok ? upstream.status : 200 });
  } catch (error) {
    return Response.json({
      code: 502,
      message: 'Could not reach the Oracle AI clip factory worker.',
      response: { error: error instanceof Error ? error.message : 'unknown fetch error' },
    }, { status: 200 });
  }
}

export const onRequestGet = async (context) => {
  const auth = await requireAdmin(context);
  if (auth) return auth;
  const url = new URL(context.request.url);
  return proxyStatus(context, url.searchParams.get('job_id') || '');
};
