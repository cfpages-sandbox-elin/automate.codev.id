export type ToolTabId =
  | 'status'
  | 'metadata'
  | 'download'
  | 'upload'
  | 'mp3'
  | 'convert'
  | 'transcribe'
  | 'audioJoin'
  | 'silence'
  | 'thumbnail'
  | 'trim'
  | 'cut'
  | 'videoJoin'
  | 'caption'
  | 'imageVideo'
  | 'screenshot'
  | 'assStyle'
  | 'jobStatus'
  | 'jobsStatus';

export type ToolGroup = 'Quick tools' | 'Audio and text' | 'Video editing' | 'Captions' | 'Images and pages' | 'History';

export type ToolTab = {
  id: ToolTabId;
  label: string;
  description: string;
  group: ToolGroup;
  advanced?: boolean;
};

export type ResultLink = {
  label: string;
  url: string;
};

export type ApiResult = {
  ok: boolean;
  status: number;
  message: string;
  endpoint?: string;
  resultUrl?: string;
  raw?: unknown;
};

export const toolTabs: ToolTab[] = [
  { id: 'status', label: 'Check link', description: 'Make sure the app is ready before you start.', group: 'Quick tools' },
  { id: 'metadata', label: 'File details', description: 'See length, size, and basic media info.', group: 'Quick tools' },
  { id: 'download', label: 'Save from link', description: 'Save a public media link into the app download area.', group: 'Quick tools' },
  { id: 'upload', label: 'Upload from link', description: 'Copy a public file link into the app download area.', group: 'Quick tools' },
  { id: 'mp3', label: 'Make MP3', description: 'Turn video or audio into an MP3 file.', group: 'Audio and text' },
  { id: 'convert', label: 'Convert file', description: 'Turn media into MP4, MOV, WEBM, WAV, MP3, or another common format.', group: 'Audio and text' },
  { id: 'transcribe', label: 'Transcript', description: 'Create text or subtitle files.', group: 'Audio and text' },
  { id: 'audioJoin', label: 'Join audio', description: 'Combine several audio links into one file.', group: 'Audio and text' },
  { id: 'silence', label: 'Add silence', description: 'Add quiet space to the start, middle, or end of audio/video.', group: 'Audio and text' },
  { id: 'trim', label: 'Trim video', description: 'Cut a shorter clip from a video.', group: 'Video editing' },
  { id: 'cut', label: 'Cut clip', description: 'Keep one or more selected time ranges from a video.', group: 'Video editing' },
  { id: 'videoJoin', label: 'Join videos', description: 'Combine several video links into one video.', group: 'Video editing' },
  { id: 'thumbnail', label: 'Thumbnail', description: 'Save an image from a video.', group: 'Video editing' },
  { id: 'caption', label: 'Caption video', description: 'Burn simple subtitles onto a video.', group: 'Captions' },
  { id: 'assStyle', label: 'Subtitle style file', description: 'Create an advanced subtitle style file for caption workflows.', group: 'Captions', advanced: true },
  { id: 'imageVideo', label: 'Image to video', description: 'Turn an image link into a short zooming social clip.', group: 'Images and pages' },
  { id: 'screenshot', label: 'Screenshot webpage', description: 'Capture a webpage you own or have permission to capture.', group: 'Images and pages' },
  { id: 'jobStatus', label: 'Job status', description: 'Check one long-running job by its job ID.', group: 'History', advanced: true },
  { id: 'jobsStatus', label: 'Job history', description: 'See recent toolkit job status files.', group: 'History', advanced: true },
];

const numericFields = new Set([
  'sample_rate', 'second', 'video_crf', 'words_per_line', 'length', 'frame_rate', 'zoom_speed', 'duration',
  'viewport_width', 'viewport_height', 'delay', 'device_scale_factor', 'quality', 'timeout', 'canvas_width',
  'canvas_height', 'font_size', 'max_words_per_line', 'outline_width', 'shadow_offset',
]);
const booleanFields = new Set([
  'include_text', 'include_srt', 'include_segments', 'word_timestamps', 'cloud_upload', 'download_audio',
  'full_page', 'omit_background', 'mono', 'all_caps', 'bold', 'public',
]);

function readLines(value: unknown): string[] {
  return typeof value === 'string' ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
}

function readStringField(fields: Record<string, unknown>, key: string): string | undefined {
  const value = fields[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function addOptional(payload: Record<string, unknown>, fields: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = buildScalarField(key, fields[key]);
    if (value !== undefined) payload[key] = value;
  }
}

function buildStylePreset(preset?: string): Record<string, unknown> | undefined {
  if (!preset) return undefined;
  if (preset === 'clean') return { font_size: 48, line_color: '&H00FFFFFF', outline_color: '&H00000000', outline_width: 2, alignment: 'center', position: 'bottom_center', style: 'classic' };
  if (preset === 'bold') return { font_size: 64, line_color: '&H00FFFFFF', outline_color: '&H00000000', outline_width: 4, bold: true, alignment: 'center', position: 'bottom_center', style: 'highlight' };
  if (preset === 'karaoke') return { font_size: 56, line_color: '&H00FFFFFF', word_color: '&H0000FFFF', outline_color: '&H00000000', outline_width: 3, alignment: 'center', position: 'bottom_center', style: 'karaoke' };
  return undefined;
}

function buildCutRanges(fields: Record<string, unknown>): Array<{ start: string; end: string }> {
  const ranges = readLines(fields.ranges);
  if (ranges.length > 0) {
    return ranges.map((range) => {
      const [start = '', end = ''] = range.split(/\s*(?:,|->|–|—)\s*/);
      return { start: start.trim(), end: end.trim() };
    }).filter((range) => range.start && range.end);
  }
  const start = readStringField(fields, 'start');
  const end = readStringField(fields, 'end');
  return start && end ? [{ start, end }] : [];
}

function buildScalarField(key: string, value: unknown): unknown | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (numericFields.has(key)) {
    const numberValue = Number(trimmed);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }
  if (booleanFields.has(key)) return trimmed === 'true';
  return trimmed;
}

export function buildPayload(tool: ToolTabId, fields: Record<string, FormDataEntryValue | boolean | number | null | undefined>): Record<string, unknown> {
  const rawFields = fields as Record<string, unknown>;

  if (tool === 'videoJoin') return { video_urls: readLines(rawFields.video_urls).map((video_url) => ({ video_url })) };
  if (tool === 'audioJoin') return { audio_urls: readLines(rawFields.audio_urls).map((audio_url) => ({ audio_url })) };
  if (tool === 'cut') {
    const payload: Record<string, unknown> = { video_url: readStringField(rawFields, 'video_url'), cuts: buildCutRanges(rawFields) };
    addOptional(payload, rawFields, ['video_crf', 'video_preset', 'audio_bitrate']);
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
  }
  if (tool === 'caption' || tool === 'assStyle') {
    const payload: Record<string, unknown> = {};
    addOptional(payload, rawFields, tool === 'caption' ? ['video_url', 'captions', 'language'] : ['media_url', 'canvas_width', 'canvas_height', 'language']);
    const settings: Record<string, unknown> = buildStylePreset(readStringField(rawFields, 'style_preset')) ?? {};
    addOptional(settings, rawFields, ['font_size', 'max_words_per_line', 'line_color', 'word_color', 'outline_color', 'outline_width']);
    if (Object.keys(settings).length > 0) payload.settings = settings;
    return payload;
  }
  if (tool === 'download') {
    const payload: Record<string, unknown> = { media_url: readStringField(rawFields, 'media_url'), cloud_upload: true };
    if (rawFields.download_audio === true) payload.audio = { extract: true, format: readStringField(rawFields, 'audio_format') ?? 'mp3', quality: readStringField(rawFields, 'audio_quality') ?? '192K' };
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawFields)) {
    const scalar = buildScalarField(key, value);
    if (scalar !== undefined) payload[key] = scalar;
  }
  return payload;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function readString(value: unknown, field: string): string | undefined {
  const record = readRecord(value);
  return typeof record?.[field] === 'string' ? record[field] : undefined;
}

export function normalizeApiResult(raw: unknown, fallbackStatus = 200): ApiResult {
  const record = readRecord(raw) ?? {};
  const code = typeof record.code === 'number' ? record.code : fallbackStatus;
  const message = typeof record.message === 'string' ? record.message : code >= 200 && code < 300 ? 'success' : 'problem';
  const response = record.response;
  const resultUrl = typeof response === 'string'
    ? response
    : readString(response, 'url') ?? readString(response, 'media_url') ?? readString(response, 'video_url') ?? readString(response, 'thumbnail_url');

  return {
    ok: code >= 200 && code < 300 && message.toLowerCase() !== 'error',
    status: code,
    message,
    endpoint: typeof record.endpoint === 'string' ? record.endpoint : undefined,
    resultUrl,
    raw,
  };
}

export function extractResultLinks(raw: unknown): ResultLink[] {
  const links: ResultLink[] = [];
  const seen = new Set<string>();

  function walk(value: unknown, parts: string[] = ['result']) {
    if (!value) return;
    if (typeof value === 'string') {
      if (/^https?:\/\//i.test(value) && !seen.has(value)) {
        seen.add(value);
        links.push({ label: parts.join('_'), url: value });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...parts, String(index + 1)]));
      return;
    }
    if (typeof value === 'object') {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) walk(nested, [...parts, key]);
    }
  }

  walk(raw, []);
  return links;
}
