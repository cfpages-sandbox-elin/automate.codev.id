import { describe, expect, it } from 'vitest';
import { buildPayload, extractResultLinks, normalizeApiResult, toolTabs } from './tool-api';

describe('tool API helpers', () => {
  it('defines compact tabs for the guided toolkit workflows', () => {
    expect(toolTabs.map((tab) => tab.id)).toEqual(['status', 'metadata', 'mp3', 'transcribe', 'thumbnail', 'trim']);
    expect(toolTabs.every((tab) => tab.label.length > 0 && tab.description.length > 0)).toBe(true);
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

  it('normalizes proxy/toolkit responses and collects result links', () => {
    const normalized = normalizeApiResult({
      code: 200,
      message: 'success',
      endpoint: '/v1/media/transcribe',
      response: {
        text_url: 'https://assets.automate.codev.id/transcript.txt',
        srt_url: 'https://assets.automate.codev.id/transcript.srt',
        text: 'hello world',
      },
    }, 200);

    expect(normalized.ok).toBe(true);
    expect(normalized.status).toBe(200);
    expect(normalized.endpoint).toBe('/v1/media/transcribe');
    expect(extractResultLinks(normalized.raw)).toEqual([
      { label: 'text_url', url: 'https://assets.automate.codev.id/transcript.txt' },
      { label: 'srt_url', url: 'https://assets.automate.codev.id/transcript.srt' },
    ]);
  });
});
