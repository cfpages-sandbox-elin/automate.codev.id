export type ToolTabId = 'status' | 'metadata' | 'mp3' | 'transcribe' | 'thumbnail' | 'trim';

export type ToolTab = {
  id: ToolTabId;
  label: string;
  description: string;
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
  { id: 'status', label: 'Check link', description: 'Make sure the app is ready before you start.' },
  { id: 'metadata', label: 'File details', description: 'See length, size, and basic media info.' },
  { id: 'mp3', label: 'Make MP3', description: 'Turn video or audio into an MP3 file.' },
  { id: 'transcribe', label: 'Transcript', description: 'Create text or subtitle files.' },
  { id: 'thumbnail', label: 'Thumbnail', description: 'Save an image from a video.' },
  { id: 'trim', label: 'Trim video', description: 'Cut a shorter clip from a video.' },
];

const numericFields = new Set(['sample_rate', 'second', 'video_crf', 'words_per_line']);
const booleanFields = new Set(['include_text', 'include_srt', 'include_segments', 'word_timestamps']);

export function buildPayload(_tool: ToolTabId, fields: Record<string, FormDataEntryValue | boolean | number | null | undefined>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') continue;

    if (typeof value === 'boolean') {
      payload[key] = value;
      continue;
    }

    if (typeof value === 'number') {
      if (Number.isFinite(value)) payload[key] = value;
      continue;
    }

    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    if (numericFields.has(key)) {
      const numberValue = Number(trimmed);
      if (Number.isFinite(numberValue)) payload[key] = numberValue;
      continue;
    }

    if (booleanFields.has(key)) {
      payload[key] = trimmed === 'true';
      continue;
    }

    payload[key] = trimmed;
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

  function walk(value: unknown, label = 'result') {
    if (!value) return;
    if (typeof value === 'string') {
      if (/^https?:\/\//i.test(value) && !seen.has(value)) {
        seen.add(value);
        links.push({ label, url: value });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${label} ${index + 1}`));
      return;
    }
    if (typeof value === 'object') {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) walk(nested, key);
    }
  }

  walk(raw);
  return links;
}
