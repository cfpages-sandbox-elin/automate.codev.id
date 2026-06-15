import { describe, expect, it } from 'vitest';
import { buildPayload, extractResultLinks, normalizeApiResult, sanitizeYoutubeCookies, splitUrlLines, toolTabs } from './tool-api';

describe('tool API helpers', () => {
  it('defines grouped tabs for the guided toolkit workflows without exposing dangerous Python execution', () => {
    const ids = toolTabs.map((tab) => tab.id);
    expect(ids).toContain('videoJoin');
    expect(ids).toContain('cut');
    expect(ids).toContain('caption');
    expect(ids).toContain('convert');
    expect(ids).toContain('download');
    expect(ids).toContain('upload');
    expect(ids).toContain('imageVideo');
    expect(ids).toContain('screenshot');
    expect(ids).toContain('audioJoin');
    expect(ids).toContain('silence');
    expect(ids).toContain('jobStatus');
    expect(ids).not.toContain('python');
    expect(toolTabs.every((tab) => tab.label.length > 0 && tab.description.length > 0 && tab.group.length > 0)).toBe(true);
  });

  it('builds a clean MP3 payload without empty optional values', () => {
    expect(buildPayload('mp3', {
      media_url: 'https://example.com/video.mp4',
      bitrate: '192k',
      sample_rate: '',
    })).toEqual({ media_url: 'https://example.com/video.mp4', bitrate: '192k' });
  });

  it('converts numeric form fields for thumbnail and trim requests', () => {
    expect(buildPayload('thumbnail', { video_url: 'https://example.com/video.mp4', second: '12.5' })).toEqual({
      video_url: 'https://example.com/video.mp4',
      second: 12.5,
    });
    expect(buildPayload('trim', { video_url: 'https://example.com/video.mp4', start: '00:00:03', end: '', video_crf: '24' })).toEqual({
      video_url: 'https://example.com/video.mp4',
      start: '00:00:03',
      video_crf: 24,
    });
  });

  it('builds array payloads for join and cut tools', () => {
    expect(buildPayload('videoJoin', { video_urls: 'https://example.com/a.mp4\nhttps://example.com/b.mp4' })).toEqual({
      video_urls: [{ video_url: 'https://example.com/a.mp4' }, { video_url: 'https://example.com/b.mp4' }],
    });
    expect(buildPayload('audioJoin', { audio_urls: 'https://example.com/a.mp3\nhttps://example.com/b.mp3' })).toEqual({
      audio_urls: [{ audio_url: 'https://example.com/a.mp3' }, { audio_url: 'https://example.com/b.mp3' }],
    });
    expect(buildPayload('cut', { video_url: 'https://example.com/v.mp4', start: '00:00:01', end: '00:00:03' })).toEqual({
      video_url: 'https://example.com/v.mp4',
      cuts: [{ start: '00:00:01', end: '00:00:03' }],
    });
  });

  it('builds guided payloads for caption, download, and screenshot helpers', () => {
    expect(buildPayload('caption', { video_url: 'https://example.com/v.mp4', style_preset: 'karaoke', language: 'en' })).toEqual({
      video_url: 'https://example.com/v.mp4',
      language: 'en',
      settings: expect.objectContaining({ style: 'karaoke' }),
    });
    expect(buildPayload('download', { media_url: 'https://youtube.com/watch?v=abc', download_audio: true, audio_format: 'mp3' })).toEqual({
      media_url: 'https://youtube.com/watch?v=abc',
      cloud_upload: true,
      audio: { extract: true, format: 'mp3', quality: '192K' },
    });
    expect(buildPayload('screenshot', { url: 'https://example.com', viewport_width: '1280', full_page: true })).toEqual({
      url: 'https://example.com/',
      viewport_width: 1280,
      full_page: true,
    });
  });

  it('sanitizes bulk links and accepts Netscape YouTube cookie exports only', () => {
    expect(splitUrlLines(' https://example.com/a.mp4#frag\nnot a url\nhttps://example.com/a.mp4\nhttp://example.com/b.mp4 ')).toEqual([
      'https://example.com/a.mp4',
      'http://example.com/b.mp4',
    ]);
    const cookie = '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t1893456000\tSID\tsecret';
    expect(sanitizeYoutubeCookies(cookie)).toContain('.youtube.com');
    expect(sanitizeYoutubeCookies('SID=secret; path=/')).toBeUndefined();
    expect(buildPayload('download', { media_url: ' https://youtube.com/watch?v=abc#t=10 ', youtube_cookies: cookie })).toEqual({
      media_url: 'https://youtube.com/watch?v=abc',
      cloud_upload: true,
      youtube_cookies: cookie,
    });
  });

  it('normalizes proxy/toolkit responses and recursively collects result links', () => {
    const normalized = normalizeApiResult({
      code: 200,
      message: 'success',
      endpoint: '/v1/media/transcribe',
      response: {
        text_url: 'https://assets.automate.codev.id/transcript.txt',
        nested: { srt_url: 'https://assets.automate.codev.id/transcript.srt' },
        text: 'hello world',
      },
    }, 200);

    expect(normalized.ok).toBe(true);
    expect(normalized.status).toBe(200);
    expect(normalized.endpoint).toBe('/v1/media/transcribe');
    expect(extractResultLinks(normalized.raw)).toEqual([
      { label: 'response_text_url', url: 'https://assets.automate.codev.id/transcript.txt' },
      { label: 'response_nested_srt_url', url: 'https://assets.automate.codev.id/transcript.srt' },
    ]);
  });
});
