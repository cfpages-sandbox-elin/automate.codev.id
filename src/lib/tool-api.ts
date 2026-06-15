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
  | 'jobsStatus'
  | 'recipeShort'
  | 'recipeTranscriptPack'
  | 'recipePodcast'
  | 'recipeBatchCaptions'
  | 'recipeWebPreview'
  | 'recipeHighlightReel';

export type RecipeTabId =
  | 'recipeShort'
  | 'recipeTranscriptPack'
  | 'recipePodcast'
  | 'recipeBatchCaptions'
  | 'recipeWebPreview'
  | 'recipeHighlightReel';
export type ExecutableToolTabId = Exclude<ToolTabId, 'status' | RecipeTabId>;

export type ToolGroup = 'Quick tools' | 'Audio and text' | 'Video editing' | 'Captions' | 'Images and pages' | 'Creative recipes' | 'History';

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

export const urlFieldByTool: Partial<Record<ToolTabId, string>> = {
  metadata: 'media_url',
  download: 'media_url',
  upload: 'file_url',
  mp3: 'media_url',
  convert: 'media_url',
  transcribe: 'media_url',
  silence: 'media_url',
  thumbnail: 'video_url',
  trim: 'video_url',
  cut: 'video_url',
  caption: 'video_url',
  assStyle: 'media_url',
  imageVideo: 'image_url',
  screenshot: 'url',
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
  { id: 'assStyle', label: 'Subtitle style file', description: 'Create a subtitle style file for caption workflows.', group: 'Captions' },
  { id: 'imageVideo', label: 'Image to video', description: 'Turn an image link into a short zooming social clip.', group: 'Images and pages' },
  { id: 'screenshot', label: 'Screenshot webpage', description: 'Capture a webpage you own or have permission to capture.', group: 'Images and pages' },
  { id: 'recipeShort', label: 'Captioned short', description: 'Turn a long video into a short clip with captions and a thumbnail.', group: 'Creative recipes' },
  { id: 'recipeTranscriptPack', label: 'Transcript pack', description: 'Create text, subtitles, and audio from a video or podcast.', group: 'Creative recipes' },
  { id: 'recipePodcast', label: 'Podcast assembly', description: 'Clean up audio, add pauses, and join intro/body/outro.', group: 'Creative recipes' },
  { id: 'recipeBatchCaptions', label: 'Batch captions', description: 'Caption many videos with the same settings.', group: 'Creative recipes' },
  { id: 'recipeWebPreview', label: 'Page preview video', description: 'Turn a webpage screenshot into a short promo video.', group: 'Creative recipes' },
  { id: 'recipeHighlightReel', label: 'Highlight reel', description: 'Cut several clips, join them, caption them, and make a cover.', group: 'Creative recipes' },
  { id: 'jobStatus', label: 'Job status', description: 'Check one long-running job by its job ID.', group: 'History' },
  { id: 'jobsStatus', label: 'Job history', description: 'See recent toolkit job status files.', group: 'History' },
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
const urlFields = new Set(['media_url', 'file_url', 'video_url', 'image_url', 'url']);
const textLimitByField: Record<string, number> = {
  youtube_cookies: 180_000,
  captions: 60_000,
  ranges: 12_000,
  video_urls: 20_000,
  audio_urls: 20_000,
  bulk_urls: 20_000,
};

export function sanitizeText(value: string, maxLength = 2_000): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(value: string): string | undefined {
  const cleaned = sanitizeText(value, 2_048);
  if (!cleaned) return undefined;
  try {
    const url = new URL(cleaned);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
}

export function splitUrlLines(value: unknown, maxItems = 25): string[] {
  if (typeof value !== 'string') return [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const part of value.split(/[\n,]+/)) {
    const url = sanitizeUrl(part);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
    if (urls.length >= maxItems) break;
  }
  return urls;
}

export function sanitizeYoutubeCookies(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = sanitizeText(value, textLimitByField.youtube_cookies);
  if (!cleaned) return undefined;
  const lines = cleaned.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
  const looksLikeNetscape = lines.some((line) => line.split('\t').length >= 7 && /(^|\.)youtube\.com$|(^|\.)google\.com$|(^|\.)googlevideo\.com$/i.test(line.split('\t')[0] ?? ''));
  return looksLikeNetscape ? cleaned : undefined;
}

function readLines(value: unknown): string[] {
  return typeof value === 'string' ? value.split(/\r?\n/).map((line) => sanitizeText(line, 2_048)).filter(Boolean) : [];
}

function readStringField(fields: Record<string, unknown>, key: string): string | undefined {
  const value = fields[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = key === 'youtube_cookies'
    ? sanitizeYoutubeCookies(value)
    : urlFields.has(key)
      ? sanitizeUrl(value)
      : sanitizeText(value, textLimitByField[key] ?? 2_000);
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

  if (key === 'youtube_cookies') return sanitizeYoutubeCookies(value);
  if (urlFields.has(key)) return sanitizeUrl(value);

  const trimmed = sanitizeText(value, textLimitByField[key] ?? 2_000);
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
    const youtubeCookies = sanitizeYoutubeCookies(rawFields.youtube_cookies);
    if (youtubeCookies) payload.youtube_cookies = youtubeCookies;
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
