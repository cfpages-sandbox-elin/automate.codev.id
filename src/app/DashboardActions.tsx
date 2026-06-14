'use client';

import {
  Activity,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Download,
  FileAudio2,
  FileSearch,
  FileText,
  HelpCircle,
  Image,
  Loader2,
  Scissors,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { buildPayload, extractResultLinks, normalizeApiResult, toolTabs } from '@/lib/tool-api';
import type { ApiResult, ToolTabId } from '@/lib/tool-api';

type LoadingKey = ToolTabId | null;
type ResultMap = Partial<Record<ToolTabId, ApiResult>>;
type FormErrorMap = Partial<Record<ToolTabId, string>>;
type IconComponent = typeof Activity;

const toolIcons: Record<ToolTabId, IconComponent> = {
  status: Activity,
  metadata: FileSearch,
  mp3: FileAudio2,
  transcribe: FileText,
  thumbnail: Image,
  trim: Scissors,
};

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
  const [formErrors, setFormErrors] = useState<FormErrorMap>({});

  async function checkHealth() {
    setLoading('status');
    setFormErrors((current) => ({ ...current, status: undefined }));
    try {
      const health = await readJson(await fetch('/api/toolkit/health', { cache: 'no-store' }));
      setResults((current) => ({ ...current, status: health }));
    } finally {
      setLoading(null);
    }
  }

  async function runSampleCheck() {
    setLoading('status');
    setFormErrors((current) => ({ ...current, status: undefined }));
    try {
      const smoke = await readJson(await fetch('/api/toolkit/smoke-test', { method: 'POST' }));
      setResults((current) => ({ ...current, status: smoke }));
    } finally {
      setLoading(null);
    }
  }

  async function submitTool(tool: Exclude<ToolTabId, 'status'>, payload: Record<string, unknown>) {
    setLoading(tool);
    setFormErrors((current) => ({ ...current, [tool]: undefined }));
    try {
      const result = await postTool(apiPaths[tool], payload);
      setResults((current) => ({ ...current, [tool]: result }));
    } finally {
      setLoading(null);
    }
  }

  const activeMeta = useMemo(() => toolTabs.find((tab) => tab.id === activeTab) ?? toolTabs[0], [activeTab]);
  const currentResult = results[activeTab];
  const ActiveIcon = toolIcons[activeTab];

  return (
    <section className="panel toolPanel" aria-labelledby="tool-heading">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Choose a task</p>
          <h2 id="tool-heading">What would you like to make?</h2>
          <p className="muted compactText">Pick one tool, paste a public media link, and run it.</p>
        </div>
        <span className={currentResult?.ok ? 'statusBadge ok' : 'statusBadge'}>
          {currentResult?.ok ? <CheckCircle2 aria-hidden="true" size={16} /> : <Sparkles aria-hidden="true" size={16} />}
          {currentResult?.ok ? 'Ready' : 'Waiting for a task'}
        </span>
      </div>

      <div className="tabShell">
        <div className="tabList" role="tablist" aria-label="Media tools">
          {toolTabs.map((tab) => {
            const Icon = toolIcons[tab.id];
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={selected ? 'tabButton active' : 'tabButton'}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={selected}
                type="button"
              >
                <Icon aria-hidden="true" size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="tabBody" role="tabpanel">
          <div className="toolIntro">
            <span className="toolIntroIcon"><ActiveIcon aria-hidden="true" size={22} /></span>
            <div>
              <h3>{activeMeta.label}</h3>
              <p>{activeMeta.description}</p>
            </div>
          </div>

          {activeTab === 'status' ? <StatusPanel loading={loading} onHealth={checkHealth} onSampleCheck={runSampleCheck} /> : null}
          {activeTab === 'metadata' ? <MetadataForm error={formErrors.metadata} loading={loading} onError={(message) => setFormErrors((current) => ({ ...current, metadata: message }))} onSubmit={(payload) => submitTool('metadata', payload)} /> : null}
          {activeTab === 'mp3' ? <Mp3Form error={formErrors.mp3} loading={loading} onError={(message) => setFormErrors((current) => ({ ...current, mp3: message }))} onSubmit={(payload) => submitTool('mp3', payload)} /> : null}
          {activeTab === 'transcribe' ? <TranscribeForm error={formErrors.transcribe} loading={loading} onError={(message) => setFormErrors((current) => ({ ...current, transcribe: message }))} onSubmit={(payload) => submitTool('transcribe', payload)} /> : null}
          {activeTab === 'thumbnail' ? <ThumbnailForm error={formErrors.thumbnail} loading={loading} onError={(message) => setFormErrors((current) => ({ ...current, thumbnail: message }))} onSubmit={(payload) => submitTool('thumbnail', payload)} /> : null}
          {activeTab === 'trim' ? <TrimForm error={formErrors.trim} loading={loading} onError={(message) => setFormErrors((current) => ({ ...current, trim: message }))} onSubmit={(payload) => submitTool('trim', payload)} /> : null}
        </div>
      </div>

      <ResultCard heading={`${activeMeta.label} result`} result={currentResult ?? null} />
    </section>
  );
}

function StatusPanel({ loading, onHealth, onSampleCheck }: { loading: LoadingKey; onHealth: () => void; onSampleCheck: () => void }) {
  return (
    <div className="statusActions">
      <button onClick={onHealth} disabled={loading !== null} type="button">
        {loading === 'status' ? <Loader2 className="spin" aria-hidden="true" size={18} /> : <Activity aria-hidden="true" size={18} />}
        {loading === 'status' ? 'Checking…' : 'Check app readiness'}
      </button>
      <button className="secondary" onClick={onSampleCheck} disabled={loading !== null} type="button">
        <CheckCircle2 aria-hidden="true" size={18} />
        Run sample check
      </button>
      <HelpTip text="Use this when the app feels stuck. It checks whether new tasks can start and whether a small sample output can be created." />
    </div>
  );
}

function MetadataForm(props: ToolFormProps) {
  return <ToolForm {...props} tool="metadata" submitLabel="Get file details" fields={<UrlField name="media_url" label="Media link" />} />;
}

function Mp3Form(props: ToolFormProps) {
  return (
    <ToolForm
      {...props}
      tool="mp3"
      submitLabel="Make MP3"
      fields={
        <>
          <UrlField name="media_url" label="Media link" />
          <TextField name="bitrate" label="Sound quality" defaultValue="128k" help="Higher numbers can sound better but make bigger files. The default is a safe choice." />
          <TextField name="sample_rate" label="Sample rate" placeholder="44100" help="Optional. Leave blank unless you already know the number you need." inputMode="numeric" />
        </>
      }
    />
  );
}

function TranscribeForm(props: ToolFormProps) {
  return (
    <ToolForm
      {...props}
      tool="transcribe"
      submitLabel="Create transcript"
      fields={
        <>
          <UrlField name="media_url" label="Media link" />
          <SelectField label="What to do" name="task" defaultValue="transcribe" options={[['transcribe', 'Write what is said'], ['translate', 'Translate to English']]} />
          <SelectField label="Result format" name="response_type" defaultValue="cloud" options={[['cloud', 'Downloadable files'], ['direct', 'Show text here']]} />
          <TextField name="language" label="Language hint" placeholder="optional: en, id, zh" help="Optional. Add this when you know the spoken language." />
          <TextField name="words_per_line" label="Subtitle line length" placeholder="optional" help="Optional. Controls how many words appear per subtitle line." inputMode="numeric" />
          <div className="checkGrid" aria-label="Transcript options">
            <CheckboxField name="include_text" label="Text file" defaultChecked />
            <CheckboxField name="include_srt" label="Subtitle file" defaultChecked />
            <CheckboxField name="include_segments" label="Detailed timing file" />
            <CheckboxField name="word_timestamps" label="Word timing" />
          </div>
        </>
      }
    />
  );
}

function ThumbnailForm(props: ToolFormProps) {
  return (
    <ToolForm
      {...props}
      tool="thumbnail"
      submitLabel="Save thumbnail"
      fields={
        <>
          <UrlField name="video_url" label="Video link" />
          <TextField name="second" label="At second" inputMode="decimal" defaultValue="0" help="Use 0 for the first frame, or choose a later second in the video." />
        </>
      }
    />
  );
}

function TrimForm(props: ToolFormProps) {
  return (
    <ToolForm
      {...props}
      tool="trim"
      submitLabel="Trim video"
      fields={
        <>
          <UrlField name="video_url" label="Video link" />
          <TextField name="start" label="Start time" placeholder="00:00:05" help="Leave blank to start from the beginning." />
          <TextField name="end" label="End time" placeholder="00:00:20" help="Leave blank to keep the video until the end." />
          <TextField name="video_crf" label="Quality number" placeholder="23" help="Optional. Lower numbers usually mean higher quality and larger files." inputMode="numeric" />
          <TextField name="video_preset" label="Speed preset" placeholder="medium" help="Optional. Leave as medium unless you need faster processing." />
          <TextField name="audio_bitrate" label="Sound quality" placeholder="128k" help="Optional. The default works for most clips." />
        </>
      }
    />
  );
}

type ToolFormProps = {
  loading: LoadingKey;
  error?: string;
  onError: (message?: string) => void;
  onSubmit: (payload: Record<string, unknown>) => void;
};

function ToolForm({ loading, tool, fields, submitLabel, error, onError, onSubmit }: ToolFormProps & { tool: Exclude<ToolTabId, 'status'>; fields: ReactNode; submitLabel: string }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const urlInput = form.querySelector('input[type="url"]') as HTMLInputElement | null;
    if (urlInput && !urlInput.validity.valid) {
      onError('Paste a valid public media link first.');
      urlInput.focus();
      return;
    }

    const data = new FormData(form);
    const checkboxValues = Object.fromEntries(
      Array.from(form.querySelectorAll('input[type="checkbox"]')).map((input) => {
        const checkbox = input as HTMLInputElement;
        return [checkbox.name, checkbox.checked];
      }),
    );
    onError(undefined);
    onSubmit(buildPayload(tool, { ...Object.fromEntries(data.entries()), ...checkboxValues }));
  }

  return (
    <form className="toolForm" onSubmit={handleSubmit} noValidate>
      <div className="formGrid">{fields}</div>
      {error ? <p className="formError"><CircleAlert aria-hidden="true" size={16} />{error}</p> : null}
      <div className="buttonRow">
        <button disabled={loading !== null} type="submit">
          {loading === tool ? <Loader2 className="spin" aria-hidden="true" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
          {loading === tool ? 'Working…' : submitLabel}
        </button>
        <p className="muted smallNote"><Clock3 aria-hidden="true" size={16} /> Bigger files can take a little longer.</p>
      </div>
    </form>
  );
}

function UrlField({ name, label }: { name: string; label: string }) {
  return <TextField name={name} label={label} type="url" placeholder="https://example.com/media.mp4" required help="Use a direct link that can be opened without signing in." />;
}

function TextField({ name, label, help, type = 'text', ...inputProps }: { name: string; label: string; help?: string; type?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'>) {
  return (
    <label className="fieldLabel">
      <span>{label}{help ? <HelpTip text={help} /> : null}</span>
      <input name={name} type={type} {...inputProps} />
    </label>
  );
}

function SelectField({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: Array<[string, string]> }) {
  return (
    <label className="fieldLabel">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  );
}

function CheckboxField({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="checkField">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="helpTip">
      <button className="helpButton" type="button" aria-label="Show help">
        <HelpCircle aria-hidden="true" size={15} />
      </button>
      <span className="helpBubble" role="tooltip">{text}</span>
    </span>
  );
}

function ResultCard({ heading, result }: { heading: string; result: ApiResult | null }) {
  if (!result) {
    return (
      <div className="resultCard emptyResult">
        <Sparkles aria-hidden="true" size={20} />
        <div>
          <h3>{heading}</h3>
          <p>Your result will appear here.</p>
        </div>
      </div>
    );
  }

  const links = extractResultLinks(result.raw);

  return (
    <div className={result.ok ? 'resultCard resultOk' : 'resultCard resultProblem'}>
      <div className="resultHeader">
        {result.ok ? <CheckCircle2 aria-hidden="true" size={20} /> : <CircleAlert aria-hidden="true" size={20} />}
        <div>
          <h3>{heading}</h3>
          <p>{result.ok ? 'Done — your result is ready.' : 'Something needs attention.'}</p>
        </div>
      </div>
      <p><strong>Message:</strong> {friendlyMessage(result.message)}</p>
      {result.resultUrl ? <p><strong>Output:</strong> <a href={result.resultUrl} target="_blank" rel="noreferrer">Open result</a></p> : null}
      {links.length > 0 ? (
        <div className="outputLinks">
          <strong>Downloads</strong>
          <ul className="linkList">
            {links.map((link) => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer"><Download aria-hidden="true" size={15} />{prettyLinkLabel(link.label)}</a></li>)}
          </ul>
        </div>
      ) : null}
      <details>
        <summary><ChevronDown aria-hidden="true" size={16} /> Troubleshooting details</summary>
        <pre>{JSON.stringify(result.raw, null, 2)}</pre>
      </details>
    </div>
  );
}

function friendlyMessage(message: string): string {
  if (message.toLowerCase() === 'success') return 'Success';
  return message;
}

function prettyLinkLabel(label: string): string {
  return label
    .replace(/_url$/i, '')
    .replace(/_/g, ' ')
    .replace(/^response$/i, 'result')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
