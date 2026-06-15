export function isYouTubeUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return hostname === 'youtube.com' || hostname === 'youtu.be' || hostname.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

export function buildYoutubeDownloadPayload(mediaUrl: string, cookie?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
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

export function readDownloadedMediaUrl(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const response = (raw as Record<string, unknown>).response;
  if (!response || typeof response !== 'object') return undefined;
  const media = (response as Record<string, unknown>).media;
  if (!media || typeof media !== 'object') return undefined;
  const mediaUrl = (media as Record<string, unknown>).media_url;
  return typeof mediaUrl === 'string' && mediaUrl.startsWith('http') ? mediaUrl : undefined;
}
