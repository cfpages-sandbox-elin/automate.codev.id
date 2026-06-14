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

function readNumber(value: unknown, field: string): number | undefined {
  const record = readRecord(value);
  return typeof record?.[field] === 'number' ? record[field] : undefined;
}

export function normalizeApiResult(raw: unknown, fallbackStatus: number): ApiResult {
  const code = readNumber(raw, 'code') ?? fallbackStatus;
  const message = readString(raw, 'message') ?? (code >= 200 && code < 300 ? 'success' : 'request failed');
  const endpoint = readString(raw, 'endpoint');
  const response = readRecord(raw)?.response;
  const resultUrl = typeof response === 'string' && response.startsWith('http') ? response : undefined;

  return {
    ok: code >= 200 && code < 300,
    status: fallbackStatus,
    message,
    endpoint,
    resultUrl,
    raw,
  };
}

export function extractResultLinks(raw: unknown): ResultLink[] {
  const root = readRecord(raw);
  const candidates = [root, readRecord(root?.response)].filter(Boolean) as Record<string, unknown>[];
  const links: ResultLink[] = [];

  for (const candidate of candidates) {
    for (const [label, value] of Object.entries(candidate)) {
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        links.push({ label, url: value });
      }
    }
  }

  return links.filter((link, index, all) => all.findIndex((item) => item.url === link.url) === index);
}
