import { verifyToken } from '@clerk/backend';

function json(status, body) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function readBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : '';
}

async function readUserRole(secretKey, userId) {
  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
    headers: {
      authorization: `Bearer ${secretKey}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) return undefined;
  const user = await response.json();
  return user?.public_metadata?.role;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (!url.pathname.startsWith('/api/') || url.pathname === '/api/healthz') {
    return context.next();
  }

  const secretKey = context.env?.CLERK_SECRET_KEY;
  if (!secretKey) {
    return json(503, { ok: false, error: 'login is not configured' });
  }

  const token = readBearerToken(context.request);
  if (!token) {
    return json(401, { ok: false, error: 'sign in required' });
  }

  let claims;
  try {
    claims = await verifyToken(token, { secretKey });
  } catch {
    return json(401, { ok: false, error: 'invalid session' });
  }

  const userId = typeof claims.sub === 'string' ? claims.sub : '';
  if (!userId) {
    return json(401, { ok: false, error: 'invalid session' });
  }

  const role = await readUserRole(secretKey, userId);
  if (role !== 'admin') {
    return json(403, { ok: false, error: 'admin access required' });
  }

  return context.next();
}
