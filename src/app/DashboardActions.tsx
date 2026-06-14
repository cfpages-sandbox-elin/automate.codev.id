'use client';

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { buildPayload, extractResultLinks, normalizeApiResult, toolTabs } from '@/lib/tool-api';
import type { ApiResult, ToolTabId } from '@/lib/tool-api';

type LoadingKey = ToolTabId | null;

type ResultMap = Partial<Record<ToolTabId, ApiResult>>;

async function readJson(response: Response): Promise<ApiResult> {
  const text = await response.text();
  let raw: unknown = null;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = { message: text || 'Empty response' };
  }
  const normalized = normalizeApiResult(raw, response.status);
  return { ...normalized, ok: response.ok && normalized.ok };
}

async function postTool(path: string, payload: Record<string, unknown>): Promise<ApiResult> {
  return readJson(
    await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );
}

const apiPaths: Record<Exclude<ToolTabId, 'status'>, string> = {
  metadata: '/api/media/metadata',
  mp3: '/api/media/convert/mp3',
  transcribe: '/api/media/transcribe',
  thumbnail: '/api/video/thumbnail',
  trim: '/api/video/trim',
};

export function DashboardActions() {
  const [activeTab, setActiveTab] = useState<ToolTabId>('status');
  const [results, setResults] = useState<ResultMap>({});
  const [loading, setLoading] = useState<LoadingKey>(null);

  async function checkHealth() {
    setLoading('status');
    try {
      const health = await readJson(await fetch('/api/toolkit/health', { cache: 'no-store' }));
      setResults((current) => ({ ...current, status: health }));
    } finally {
      setLoading(null);
    }
  }

  async function runSmokeTest() {
    setLoading('status');
    try {
      const smoke = await readJson(await fetch('/api/toolkit/smoke-test', { method: 'POST' }));
      setResults((current) => ({ ...current, status: smoke }));
    } finally {
      setLoading(null);
    }
  }

  async function submitTool(tool: Exclude<ToolTabId, 'status'>, payload: Record<string, unknown>) {
    setLoading(tool);
    try {
      const result = await postTool(apiPaths[tool], payload);
      setResults((current) => ({ ...current, [tool]: result }));
    } finally {
      setLoading(null);
    }
  }

  const currentResult = results[activeTab];

  return (
    <section className="panel toolPanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Guided toolkit actions</p>
          <h2>Choose a task</h2>
          <p className="muted">Tabs keep the page compact. Paste public media URLs; output files land in R2 when the toolkit returns a file.</p>
        </div>
        <span className={currentResult?.ok ? 'pill ok' : 'pill warn'}>{currentResult?.ok ? 'Last run OK' : 'Ready'}</span>
      </div>

      <div className="tabList" role="tablist" aria-label="Toolkit actions">
        {toolTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'tabButton active' : 'tabButton'}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            type="button"
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </div>

      <div className="tabBody" role="tabpanel">
        {activeTab === 'status' ? (
          <StatusPanel loading={loading} onHealth={checkHealth} onSmoke={runSmokeTest} />
        ) : null}
        {activeTab === 'metadata' ? <MetadataForm loading={loading} onSubmit={(payload) => submitTool('metadata', payload)} /> : null}
        {activeTab === 'mp3' ? <Mp3Form loading={loading} onSubmit={(payload) => submitTool('mp3', payload)} /> : null}
        {activeTab === 'transcribe' ? <TranscribeForm loading={loading} onSubmit={(payload) => submitTool('transcribe', payload)} /> : null}
        {activeTab === 'thumbnail' ? <ThumbnailForm loading={loading} onSubmit={(payload) => submitTool('thumbnail', payload)} /> : null}
        {activeTab === 'trim' ? <TrimForm loading={loading} onSubmit={(payload) => submitTool('trim', payload)} /> : null}
      </div>

      <ResultCard title={`${toolTabs.find((tab) => tab.id === activeTab)?.label ?? 'Tool'} result`} result={currentResult ?? null} />
    </section>
  );
}

function StatusPanel({ loading, onHealth, onSmoke }: { loading: LoadingKey; onHealth: () => void; onSmoke: () => void }) {
  return (
    <div className="formGrid compact">
      <div>
        <h3>Backend checks</h3>
        <p className="muted">Use these first when something feels broken. Health checks the private toolkit API; smoke test confirms R2 upload still works.</p>
      </div>
      <div className="buttonRow">
        <button onClick={onHealth} disabled={loading !== null} type="button">{loading === 'status' ? 'Checking…' : 'Check backend health'}</button>
        <button className="secondary" onClick={onSmoke} disabled={loading !== null} type="button">{loading === 'status' ? 'Working…' : 'Run R2 smoke test'}</button>
      </div>
    </div>
  );
}

function MetadataForm({ loading, onSubmit }: ToolFormProps) {
  return <ToolForm loading={loading} tool="metadata" submitLabel="Read metadata" onSubmit={onSubmit} fields={<UrlField name="media_url" label="Media URL" />} />;
}

function Mp3Form({ loading, onSubmit }: ToolFormProps) {
  return (
    <ToolForm
      loading={loading}
      tool="mp3"
      submitLabel="Convert to MP3"
      onSubmit={onSubmit}
      fields={
        <>
          <UrlField name="media_url" label="Media URL" />
          <label>Bitrate <input name="bitrate" defaultValue="128k" placeholder="128k" /></label>
          <label>Sample rate <input name="sample_rate" inputMode="numeric" placeholder="44100" /></label>
        </>
      }
    />
  );
}

function TranscribeForm({ loading, onSubmit }: ToolFormProps) {
  return (
    <ToolForm
      loading={loading}
      tool="transcribe"
      submitLabel="Start transcription"
      onSubmit={onSubmit}
      fields={
        <>
          <UrlField name="media_url" label="Media URL" />
          <label>Task <select name="task" defaultValue="transcribe"><option value="transcribe">Transcribe original language</option><option value="translate">Translate to English</option></select></label>
          <label>Response <select name="response_type" defaultValue="cloud"><option value="cloud">R2 files</option><option value="direct">Direct JSON text</option></select></label>
          <label>Language hint <input name="language" placeholder="optional: en, id, zh" /></label>
          <label>Words per SRT line <input name="words_per_line" inputMode="numeric" placeholder="optional" /></label>
          <div className="checkGrid">
            <label><input name="include_text" type="checkbox" defaultChecked /> Text</label>
            <label><input name="include_srt" type="checkbox" defaultChecked /> SRT subtitles</label>
            <label><input name="include_segments" type="checkbox" /> Segments JSON</label>
            <label><input name="word_timestamps" type="checkbox" /> Word timestamps</label>
          </div>
        </>
      }
    />
  );
}

function ThumbnailForm({ loading, onSubmit }: ToolFormProps) {
  return (
    <ToolForm
      loading={loading}
      tool="thumbnail"
      submitLabel="Create thumbnail"
      onSubmit={onSubmit}
      fields={
        <>
          <UrlField name="video_url" label="Video URL" />
          <label>Second <input name="second" inputMode="decimal" defaultValue="0" /></label>
        </>
      }
    />
  );
}

function TrimForm({ loading, onSubmit }: ToolFormProps) {
  return (
    <ToolForm
      loading={loading}
      tool="trim"
      submitLabel="Trim video"
      onSubmit={onSubmit}
      fields={
        <>
          <UrlField name="video_url" label="Video URL" />
          <label>Start time <input name="start" placeholder="00:00:05" /></label>
          <label>End time <input name="end" placeholder="00:00:20" /></label>
          <label>Video CRF <input name="video_crf" inputMode="numeric" placeholder="23" /></label>
          <label>Video preset <input name="video_preset" placeholder="medium" /></label>
          <label>Audio bitrate <input name="audio_bitrate" placeholder="128k" /></label>
        </>
      }
    />
  );
}

type ToolFormProps = {
  loading: LoadingKey;
  onSubmit: (payload: Record<string, unknown>) => void;
};

function ToolForm({
  loading,
  tool,
  fields,
  submitLabel,
  onSubmit,
}: ToolFormProps & { tool: Exclude<ToolTabId, 'status'>; fields: ReactNode; submitLabel: string }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const checkboxValues = Object.fromEntries(
      Array.from(form.querySelectorAll('input[type="checkbox"]')).map((input) => {
        const checkbox = input as HTMLInputElement;
        return [checkbox.name, checkbox.checked];
      }),
    );
    onSubmit(buildPayload(tool, { ...Object.fromEntries(data.entries()), ...checkboxValues }));
  }

  return (
    <form className="toolForm" onSubmit={handleSubmit}>
      <div className="formGrid">{fields}</div>
      <div className="buttonRow">
        <button disabled={loading !== null} type="submit">{loading === tool ? 'Working…' : submitLabel}</button>
        <p className="muted smallNote">Large media jobs may take a while. Keep this tab open until the result appears.</p>
      </div>
    </form>
  );
}

function UrlField({ name, label }: { name: string; label: string }) {
  return <label>{label} <input name={name} required type="url" placeholder="https://example.com/media.mp4" /></label>;
}

function ResultCard({ title, result }: { title: string; result: ApiResult | null }) {
  if (!result) {
    return <div className="resultCard mutedBox"><h3>{title}</h3><p>No result yet.</p></div>;
  }

  const links = extractResultLinks(result.raw);

  return (
    <div className={result.ok ? 'resultCard resultOk' : 'resultCard resultProblem'}>
      <h3>{title}</h3>
      <p><strong>Status:</strong> {result.ok ? 'OK' : 'Problem'} ({result.status})</p>
      <p><strong>Message:</strong> {result.message}</p>
      {result.endpoint ? <p><strong>Endpoint:</strong> {result.endpoint}</p> : null}
      {result.resultUrl ? <p><strong>Output:</strong> <a href={result.resultUrl} target="_blank" rel="noreferrer">Open output</a></p> : null}
      {links.length > 0 ? (
        <div>
          <strong>Links:</strong>
          <ul className="linkList">
            {links.map((link) => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>)}
          </ul>
        </div>
      ) : null}
      <details>
        <summary>Raw response</summary>
        <pre>{JSON.stringify(result.raw, null, 2)}</pre>
      </details>
    </div>
  );
}
