function isYouTubeUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return hostname === 'youtube.com' || hostname === 'youtu.be' || hostname.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

function buildYoutubeDownloadPayload(mediaUrl, cookie) {
  const payload = {
    media_url: mediaUrl,
    cloud_upload: true,
    audio: {
      extract: true,
      format: 'mp3',
      quality: '192K',
    },
    download: {
      max_filesize: 314572800,
      retries: 2,
    },
  };
  if (cookie) payload.cookie = cookie;
  return payload;
}

function readDownloadedMediaUrl(raw) {
  const mediaUrl = raw?.response?.media?.media_url;
  return typeof mediaUrl === 'string' && mediaUrl.startsWith('http') ? mediaUrl : undefined;
}

async function callOracle(context, options) {
  const env = context.env || {};
  const baseUrl = env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = env.ORACLE_BACKEND_PROXY_SECRET || env.CODEV_API_PROXY_TOKEN;
  if (!token) {
    return { ok: false, status: 500, data: { ok: false, status: 500, message: 'Backend secret is missing.' } };
  }

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  let body;
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  try {
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
    return { ok: upstream.ok, status: upstream.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: {
        ok: false,
        status: 502,
        message: 'Could not reach the media worker.',
        error: error instanceof Error ? error.message : 'unknown fetch error',
      },
    };
  }
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export const onRequestPost = async (context) => {
  const body = await readJsonBody(context.request);
  const mediaUrl = typeof body.media_url === 'string' ? body.media_url : '';
  const transcribeBody = { ...body };
  let youtubeDownload;

  if (isYouTubeUrl(mediaUrl)) {
    youtubeDownload = await callOracle(context, {
      path: '/nca/media/download',
      method: 'POST',
      body: buildYoutubeDownloadPayload(mediaUrl, context.env?.YOUTUBE_COOKIES),
    });

    const downloadedUrl = readDownloadedMediaUrl(youtubeDownload.data);
    if (!downloadedUrl) {
      return Response.json({
        ok: false,
        code: youtubeDownload.data?.code ?? youtubeDownload.status,
        message: 'Could not prepare that YouTube link for transcription. Try a public video or a direct media link.',
        response: youtubeDownload.data?.response,
      }, { status: 200 });
    }

    transcribeBody.media_url = downloadedUrl;
  }

  const transcription = await callOracle(context, {
    path: '/nca/media/transcribe',
    method: 'POST',
    body: transcribeBody,
  });

  const data = transcription.data && typeof transcription.data === 'object'
    ? { ...transcription.data }
    : { message: transcription.data };

  if (youtubeDownload && data.response && typeof data.response === 'object') {
    data.response = {
      ...data.response,
      prepared_from_youtube: true,
    };
  }

  return Response.json(data, { status: 200 });
};
