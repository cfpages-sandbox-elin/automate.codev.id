import { describe, expect, it } from 'vitest';
import { buildYoutubeDownloadPayload, isYouTubeUrl, readDownloadedMediaUrl } from './youtube-transcription';

describe('YouTube transcription helpers', () => {
  it('recognizes YouTube watch and short URLs', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
    expect(isYouTubeUrl('https://youtu.be/abc123')).toBe(true);
    expect(isYouTubeUrl('https://m.youtube.com/watch?v=abc123')).toBe(true);
    expect(isYouTubeUrl('https://example.com/video.mp4')).toBe(false);
    expect(isYouTubeUrl('not a url')).toBe(false);
  });

  it('builds a conservative audio extraction payload', () => {
    expect(buildYoutubeDownloadPayload('https://youtu.be/abc123')).toEqual({
      media_url: 'https://youtu.be/abc123',
      cloud_upload: true,
      audio: { extract: true, format: 'mp3', quality: '192K' },
      download: { max_filesize: 314572800, retries: 2 },
    });
    expect(buildYoutubeDownloadPayload('https://youtu.be/abc123', 'cookie-data')).toMatchObject({ cookie: 'cookie-data' });
  });

  it('reads the uploaded media URL from the download result', () => {
    expect(readDownloadedMediaUrl({ response: { media: { media_url: 'https://assets.automate.codev.id/audio.mp3' } } })).toBe('https://assets.automate.codev.id/audio.mp3');
    expect(readDownloadedMediaUrl({ response: { media: { media_url: '/local/file.mp3' } } })).toBeUndefined();
  });
});
