'use client';

import { useAuth } from '@clerk/clerk-react';
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
  Film,
  HelpCircle,
  History,
  Image,
  Loader2,
  Scissors,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { buildPayload, extractResultLinks, normalizeApiResult, splitUrlLines, toolTabs, urlFieldByTool } from '@/lib/tool-api';
import type { ApiResult, ExecutableToolTabId, RecipeTabId, ToolGroup, ToolTabId } from '@/lib/tool-api';

type LoadingKey = ToolTabId | null;
type ResultMap = Partial<Record<ToolTabId, ApiResult>>;
type FormErrorMap = Partial<Record<ToolTabId, string>>;
type IconComponent = typeof Activity;

const toolIcons: Record<ToolTabId, IconComponent> = {
  status: Activity,
  metadata: FileSearch,
  download: Download,
  upload: UploadCloud,
  mp3: FileAudio2,
  convert: FileAudio2,
  transcribe: FileText,
  audioJoin: FileAudio2,
  silence: FileAudio2,
  thumbnail: Image,
  trim: Scissors,
  cut: Scissors,
  videoJoin: Film,
  caption: FileText,
  assStyle: FileText,
  imageVideo: Image,
  screenshot: Image,
  jobStatus: History,
  jobsStatus: History,
  aiClipDirector: Sparkles,
  recipeShort: Sparkles,
  recipeTranscriptPack: FileText,
  recipePodcast: FileAudio2,
  recipeBatchCaptions: FileText,
  recipeWebPreview: Image,
  recipeHighlightReel: Film,
};

const categoryIcons: Record<ToolGroup, IconComponent> = {
  'Quick tools': Sparkles,
  'Audio and text': FileAudio2,
  'Video editing': Film,
  Captions: FileText,
  'Images and pages': Image,
  'Creative recipes': Sparkles,
  History,
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

async function apiFetch(path: string, token: string | null, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  return fetch(path, { ...init, headers });
}

async function postTool(path: string, payload: Record<string, unknown>, token: string | null): Promise<ApiResult> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('authorization', `Bearer ${token}`);
  return readJson(await fetch(path, { method: 'POST', headers, body: JSON.stringify(payload) }));
}

const apiPaths: Record<ExecutableToolTabId, string> = {
  metadata: '/api/media/metadata',
  download: '/api/media/download',
  upload: '/api/storage/upload',
  mp3: '/api/media/convert/mp3',
  convert: '/api/media/convert',
  transcribe: '/api/media/transcribe',
  audioJoin: '/api/audio/concatenate',
  silence: '/api/media/silence',
  thumbnail: '/api/video/thumbnail',
  trim: '/api/video/trim',
  cut: '/api/video/cut',
  videoJoin: '/api/video/concatenate',
  caption: '/api/video/caption',
  assStyle: '/api/media/generate/ass',
  imageVideo: '/api/image/convert/video',
  screenshot: '/api/image/screenshot/webpage',
  jobStatus: '/api/toolkit/job/status',
  jobsStatus: '/api/toolkit/jobs/status',
  aiClipDirector: '/api/ai/clip-plan',
};

const recipeIds = new Set<ToolTabId>([
  'recipeShort',
  'recipeTranscriptPack',
  'recipePodcast',
  'recipeBatchCaptions',
  'recipeWebPreview',
  'recipeHighlightReel',
]);

function isRecipeTab(id: ToolTabId): id is RecipeTabId {
  return recipeIds.has(id);
}

function isExecutableTab(id: ToolTabId): id is ExecutableToolTabId {
  return id !== 'status' && !isRecipeTab(id);
}

export function DashboardActions() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<ToolTabId>('status');
  const [activeCategory, setActiveCategory] = useState<ToolGroup>('Quick tools');
  const [results, setResults] = useState<ResultMap>({});
  const [loading, setLoading] = useState<LoadingKey>(null);
  const [formErrors, setFormErrors] = useState<FormErrorMap>({});

  async function checkHealth() {
    setLoading('status');
    setFormErrors((current) => ({ ...current, status: undefined }));
    try {
      const token = await getToken();
      const health = await readJson(await apiFetch('/api/toolkit/health', token, { cache: 'no-store' }));
      setResults((current) => ({ ...current, status: health }));
    } finally {
      setLoading(null);
    }
  }

  async function runSampleCheck() {
    setLoading('status');
    setFormErrors((current) => ({ ...current, status: undefined }));
    try {
      const token = await getToken();
      const smoke = await readJson(await apiFetch('/api/toolkit/smoke-test', token, { method: 'POST' }));
      setResults((current) => ({ ...current, status: smoke }));
    } finally {
      setLoading(null);
    }
  }

  async function pollClipFactoryJob(initialResult: ApiResult, token: string | null) {
    const raw = initialResult.raw as { job_id?: string } | null;
    const jobId = raw?.job_id;
    if (!jobId) return;
    setLoading('aiClipDirector');
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt < 4 ? 2500 : 5000));
      const status = await readJson(await apiFetch(`/api/ai/clip-plan/status?job_id=${encodeURIComponent(jobId)}`, token, { cache: 'no-store' }));
      setResults((current) => ({ ...current, aiClipDirector: status }));
      const statusRaw = status.raw as { status?: string } | null;
      if (statusRaw?.status === 'done' || statusRaw?.status === 'failed') break;
    }
    setLoading(null);
  }

  async function submitTool(tool: ExecutableToolTabId, payload: Record<string, unknown> | Array<Record<string, unknown>>) {
    setLoading(tool);
    setFormErrors((current) => ({ ...current, [tool]: undefined }));
    try {
      const token = await getToken();
      if (Array.isArray(payload)) {
        const responses: ApiResult[] = [];
        for (const item of payload) responses.push(await postTool(apiPaths[tool], item, token));
        const failures = responses.filter((item) => !item.ok).length;
        setResults((current) => ({
          ...current,
          [tool]: {
            ok: failures === 0,
            status: failures === 0 ? 200 : 207,
            message: failures === 0 ? `Finished ${responses.length} items.` : `Finished ${responses.length - failures} of ${responses.length} items.`,
            raw: { bulk: true, total: responses.length, failures, results: responses.map((item) => item.raw) },
          },
        }));
        return;
      }
      const result = await postTool(apiPaths[tool], payload, token);
      setResults((current) => ({ ...current, [tool]: result }));
      if (tool === 'aiClipDirector' && result.ok) pollClipFactoryJob(result, token);
    } finally {
      setLoading(null);
    }
  }

  const visibleTabs = toolTabs;
  const groupedTabs = useMemo(() => {
    const groups = new Map<ToolGroup, typeof toolTabs>();
    for (const tab of visibleTabs) groups.set(tab.group, [...(groups.get(tab.group) ?? []), tab]);
    return Array.from(groups.entries());
  }, [visibleTabs]);
  const selectedCategory = groupedTabs.some(([group]) => group === activeCategory) ? activeCategory : groupedTabs[0]?.[0] ?? 'Quick tools';
  const categoryTools = useMemo(() => visibleTabs.filter((tab) => tab.group === selectedCategory), [selectedCategory, visibleTabs]);
  const activeMeta = useMemo(() => {
    const visibleActive = visibleTabs.find((tab) => tab.id === activeTab);
    return visibleActive ?? categoryTools[0] ?? visibleTabs[0] ?? toolTabs[0];
  }, [activeTab, categoryTools, visibleTabs]);
  const selectedToolId = activeMeta.id;
  const currentResult = results[selectedToolId];
  const ActiveIcon = toolIcons[selectedToolId];

  function selectCategory(group: ToolGroup) {
    setActiveCategory(group);
    const firstTool = visibleTabs.find((tab) => tab.group === group);
    if (firstTool) setActiveTab(firstTool.id);
  }

  return (
    <section className="panel toolPanel" aria-labelledby="tool-heading">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Choose a task</p>
          <h2 id="tool-heading">What would you like to make?</h2>
          <p className="muted compactText">All tools are visible. Pick a tool or a recipe, paste your links, and run it.</p>
        </div>
      </div>

      <div className="tabShell categoryShell">
        <aside className="categorySideTabs" aria-label="Tool categories">
          <p className="sideTabsLabel">Categories</p>
          <div role="tablist" aria-orientation="vertical">
            {groupedTabs.map(([group, tabs]) => {
              const selected = selectedCategory === group;
              const CategoryIcon = categoryIcons[group];
              return (
                <button key={group} className={selected ? 'categoryTab active' : 'categoryTab'} onClick={() => selectCategory(group)} role="tab" aria-selected={selected} type="button">
                  <span className="categoryTabIcon"><CategoryIcon aria-hidden="true" size={18} /></span>
                  <span className="categoryTabText">
                    <strong>{group}</strong>
                    <small>{tabs.length} {tabs.length === 1 ? 'tool' : 'tools'}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="toolWorkspace">
          <div className="featureTabs" role="tablist" aria-label={`${selectedCategory} features`}>
            {categoryTools.map((tab) => {
              const Icon = toolIcons[tab.id];
              const selected = selectedToolId === tab.id;
              return (
                <button key={tab.id} className={selected ? 'featureTab active' : 'featureTab'} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={selected} type="button">
                  <Icon aria-hidden="true" size={17} />
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

            {selectedToolId === 'status' ? <StatusPanel loading={loading} onHealth={checkHealth} onSampleCheck={runSampleCheck} /> : null}
            {isRecipeTab(selectedToolId) ? <RecipePanel recipe={selectedToolId} onOpenTool={setActiveTab} /> : null}
            {isExecutableTab(selectedToolId) ? <ActiveToolForm activeTab={selectedToolId} error={formErrors[selectedToolId]} loading={loading} onError={(message) => setFormErrors((current) => ({ ...current, [selectedToolId]: message }))} onSubmit={(payload) => submitTool(selectedToolId, payload)} /> : null}
          </div>
        </div>
      </div>

      <ResultCard heading={`${activeMeta.label} result`} result={currentResult ?? null} />
    </section>
  );
}

type RecipeStep = {
  tool: ExecutableToolTabId;
  label: string;
  note: string;
};

type RecipeDefinition = {
  title: string;
  outcome: string;
  when: string;
  steps: RecipeStep[];
};

const recipes: Record<RecipeTabId, RecipeDefinition> = {
  recipeShort: {
    title: 'Captioned short from a long video',
    outcome: 'Make a short social clip with readable captions and a cover image.',
    when: 'Use this for YouTube clips, interviews, lessons, webinars, or any long video that has one good moment inside it.',
    steps: [
      { tool: 'download', label: 'Save the source', note: 'Bring a YouTube or remote video link into the app first if needed.' },
      { tool: 'trim', label: 'Keep the best part', note: 'Cut the video down to the short moment you want.' },
      { tool: 'transcribe', label: 'Make subtitles', note: 'Create text and SRT subtitle files from the clip.' },
      { tool: 'caption', label: 'Burn captions in', note: 'Put the subtitles directly onto the video.' },
      { tool: 'thumbnail', label: 'Make a cover', note: 'Save a strong frame as the thumbnail.' },
    ],
  },
  recipeTranscriptPack: {
    title: 'Transcript pack from video or podcast',
    outcome: 'Create audio, text, and subtitles from a video or podcast.',
    when: 'Use this when you want notes, searchable text, captions, or source material for blog/social posts.',
    steps: [
      { tool: 'download', label: 'Save the media', note: 'Use this for remote links or YouTube sources.' },
      { tool: 'mp3', label: 'Make audio', note: 'Create an MP3 that is easier to reuse.' },
      { tool: 'transcribe', label: 'Create text and SRT', note: 'Turn speech into text and subtitle files.' },
      { tool: 'jobsStatus', label: 'Collect outputs', note: 'Check recent results if the work ran as a longer job.' },
    ],
  },
  recipePodcast: {
    title: 'Podcast assembly',
    outcome: 'Build one clean episode from intro, body audio, pauses, and outro.',
    when: 'Use this when episode parts are separate files and need consistent spacing.',
    steps: [
      { tool: 'convert', label: 'Normalize formats', note: 'Convert parts into the same audio format if needed.' },
      { tool: 'silence', label: 'Add breathing room', note: 'Add quiet gaps before, between, or after parts.' },
      { tool: 'audioJoin', label: 'Join audio', note: 'Combine intro, episode, and outro in order.' },
      { tool: 'metadata', label: 'Check the result', note: 'Confirm duration and basic file information.' },
    ],
  },
  recipeBatchCaptions: {
    title: 'Batch captions for many videos',
    outcome: 'Create subtitles or captioned videos for many links with the same settings.',
    when: 'Use this for social media batches, lesson batches, or recurring creator workflows.',
    steps: [
      { tool: 'transcribe', label: 'Bulk transcribe', note: 'Turn on Bulk links and create subtitle files for many videos.' },
      { tool: 'caption', label: 'Bulk caption', note: 'Use the same style settings on each video.' },
      { tool: 'jobsStatus', label: 'Review jobs', note: 'Check recent outputs and failed items.' },
    ],
  },
  recipeWebPreview: {
    title: 'Page preview video',
    outcome: 'Turn a webpage into a short moving preview clip.',
    when: 'Use this for product pages, landing pages, app screens, or quick promo assets.',
    steps: [
      { tool: 'screenshot', label: 'Capture the page', note: 'Take a clean screenshot of the page.' },
      { tool: 'imageVideo', label: 'Animate it', note: 'Turn the screenshot into a short zooming video.' },
      { tool: 'convert', label: 'Choose final format', note: 'Convert if you need MP4, WEBM, GIF, or another format.' },
    ],
  },
  recipeHighlightReel: {
    title: 'Highlight reel from several clips',
    outcome: 'Cut several good moments, join them, caption them, and make a cover.',
    when: 'Use this for testimonials, event recaps, sports clips, tutorials, or creator highlights.',
    steps: [
      { tool: 'cut', label: 'Cut the moments', note: 'Keep exact time ranges from each source.' },
      { tool: 'videoJoin', label: 'Join the clips', note: 'Combine the clips into one reel.' },
      { tool: 'caption', label: 'Add captions', note: 'Make spoken parts readable without sound.' },
      { tool: 'thumbnail', label: 'Make a cover', note: 'Save a strong frame for sharing.' },
    ],
  },
};

function RecipePanel({ recipe, onOpenTool }: { recipe: RecipeTabId; onOpenTool: (tool: ToolTabId) => void }) {
  const details = recipes[recipe];
  return (
    <div className="recipePanel">
      <div className="recipeHero">
        <Sparkles aria-hidden="true" size={22} />
        <div>
          <h3>{details.title}</h3>
          <p>{details.outcome}</p>
          <p className="muted smallNote">{details.when}</p>
        </div>
      </div>
      <ol className="recipeSteps">
        {details.steps.map((step, index) => (
          <li key={`${step.tool}-${index}`}>
            <span className="recipeNumber">{index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.note}</p>
            </div>
            <button className="secondary smallButton" type="button" onClick={() => onOpenTool(step.tool)}>Open tool</button>
          </li>
        ))}
      </ol>
      <p className="muted smallNote">First pass: recipes guide you through existing tools. Later this can become one-click chaining with saved intermediate outputs.</p>
    </div>
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

type ToolFormProps = {
  loading: LoadingKey;
  error?: string;
  onError: (message?: string) => void;
  onSubmit: (payload: Record<string, unknown> | Array<Record<string, unknown>>) => void;
};

function ActiveToolForm({ activeTab, ...props }: ToolFormProps & { activeTab: ExecutableToolTabId }) {
  switch (activeTab) {
    case 'metadata':
      return <ToolForm {...props} tool="metadata" submitLabel="Get file details" fields={<UrlField name="media_url" label="Media link" />} />;
    case 'download':
      return <ToolForm {...props} tool="download" submitLabel="Save from link" fields={<><UrlField name="media_url" label="Media or page link" help="Public links work best. For YouTube, add an exported cookie file below when normal download is blocked." /><CheckboxField name="download_audio" label="Save audio only" /><TextField name="audio_format" label="Audio format" defaultValue="mp3" help="Used only when saving audio only." /><YoutubeCookieField /></>} />;
    case 'upload':
      return <ToolForm {...props} tool="upload" submitLabel="Upload from link" fields={<><UrlField name="file_url" label="File link" /><TextField name="filename" label="New file name" placeholder="optional: clip.mp4" help="Optional. Leave blank to keep the original name when possible." /><CheckboxField name="public" label="Make the result link public" defaultChecked /></>} />;
    case 'mp3':
      return <ToolForm {...props} tool="mp3" submitLabel="Make MP3" fields={<><UrlField name="media_url" label="Media link" /><TextField name="bitrate" label="Sound quality" defaultValue="128k" help="Higher numbers can sound better but make bigger files." /><TextField name="sample_rate" label="Sample rate" placeholder="44100" help="Optional. Leave blank unless you know the number you need." inputMode="numeric" /></>} />;
    case 'convert':
      return <ToolForm {...props} tool="convert" submitLabel="Convert file" fields={<><UrlField name="media_url" label="Media link" /><SelectField label="New format" name="format" defaultValue="mp4" options={[['mp4', 'MP4 video'], ['mov', 'MOV video'], ['webm', 'WEBM video'], ['mp3', 'MP3 audio'], ['wav', 'WAV audio'], ['m4a', 'M4A audio'], ['gif', 'GIF animation']]} /><TextField name="video_crf" label="Video quality number" placeholder="23" help="Optional. Lower usually means higher quality and larger files." inputMode="numeric" /><TextField name="audio_bitrate" label="Sound quality" placeholder="128k" help="Optional. The default works for most files." /></>} />;
    case 'transcribe':
      return <ToolForm {...props} tool="transcribe" submitLabel="Create transcript" fields={<><UrlField name="media_url" label="Media or YouTube link" help="Paste a direct media link or a YouTube link. For YouTube videos that need your browser session, add an exported cookie file below." /><SelectField label="What to do" name="task" defaultValue="transcribe" options={[['transcribe', 'Write what is said'], ['translate', 'Translate to English']]} /><SelectField label="Result format" name="response_type" defaultValue="cloud" options={[['cloud', 'Downloadable files'], ['direct', 'Show text here']]} /><TextField name="language" label="Language hint" placeholder="optional: en, id, zh" help="Optional. Add this when you know the spoken language." /><TextField name="words_per_line" label="Subtitle line length" placeholder="optional" help="Optional. Controls how many words appear per subtitle line." inputMode="numeric" /><div className="checkGrid" aria-label="Transcript options"><CheckboxField name="include_text" label="Text file" defaultChecked /><CheckboxField name="include_srt" label="Subtitle file" defaultChecked /><CheckboxField name="include_segments" label="Detailed timing file" /><CheckboxField name="word_timestamps" label="Word timing" /></div><YoutubeCookieField /></>} />;
    case 'audioJoin':
      return <ToolForm {...props} tool="audioJoin" submitLabel="Join audio" fields={<MultiUrlField name="audio_urls" label="Audio links" help="Paste one audio link per line. They will be combined in this order." />} />;
    case 'silence':
      return <ToolForm {...props} tool="silence" submitLabel="Add silence" fields={<><UrlField name="media_url" label="Media link" /><TextField name="duration" label="Silence length in seconds" required inputMode="decimal" placeholder="2" /><TextField name="start" label="Start time" placeholder="optional: 00:00:05" help="Optional. Where to add or replace silence." /><TextField name="end" label="End time" placeholder="optional: 00:00:10" /><CheckboxField name="mono" label="Make silence mono" /></>} />;
    case 'thumbnail':
      return <ToolForm {...props} tool="thumbnail" submitLabel="Save thumbnail" fields={<><UrlField name="video_url" label="Video link" /><TextField name="second" label="At second" inputMode="decimal" defaultValue="0" help="Use 0 for the first frame, or choose a later second." /></>} />;
    case 'trim':
      return <ToolForm {...props} tool="trim" submitLabel="Trim video" fields={<><UrlField name="video_url" label="Video link" /><TextField name="start" label="Start time" placeholder="00:00:05" help="Leave blank to start from the beginning." /><TextField name="end" label="End time" placeholder="00:00:20" help="Leave blank to keep the video until the end." /><TextField name="video_crf" label="Quality number" placeholder="23" help="Optional. Lower usually means higher quality and larger files." inputMode="numeric" /><TextField name="video_preset" label="Speed preset" placeholder="medium" help="Optional. Leave as medium unless you need faster processing." /><TextField name="audio_bitrate" label="Sound quality" placeholder="128k" help="Optional. The default works for most clips." /></>} />;
    case 'cut':
      return <ToolForm {...props} tool="cut" submitLabel="Cut clip" fields={<><UrlField name="video_url" label="Video link" /><TextField name="start" label="Start time" placeholder="00:00:05" required /><TextField name="end" label="End time" placeholder="00:00:20" required /><TextAreaField name="ranges" label="More ranges" placeholder={'00:00:30, 00:00:45\n00:01:10, 00:01:25'} help="Optional. Add one start/end pair per line if you want several clips kept." /><TextField name="video_crf" label="Quality number" placeholder="23" inputMode="numeric" /></>} />;
    case 'videoJoin':
      return <ToolForm {...props} tool="videoJoin" submitLabel="Join videos" fields={<MultiUrlField name="video_urls" label="Video links" help="Paste one video link per line. They will be combined in this order." />} />;
    case 'caption':
      return <ToolForm {...props} tool="caption" submitLabel="Caption video" fields={<><UrlField name="video_url" label="Video link" /><TextAreaField name="captions" label="Captions" placeholder={'1\n00:00:00,000 --> 00:00:02,000\nHello world'} help="Optional. Paste SRT text if you already have captions. If blank, the toolkit may create captions from the audio." /><SelectField name="style_preset" label="Style" defaultValue="clean" options={[['clean', 'Clean'], ['bold', 'Bold'], ['karaoke', 'Karaoke/highlight']]} /><TextField name="language" label="Language hint" placeholder="optional: en, id" /></>} />;
    case 'imageVideo':
      return <ToolForm {...props} tool="imageVideo" submitLabel="Create video" fields={<><UrlField name="image_url" label="Image link" /><TextField name="length" label="Length in seconds" defaultValue="5" inputMode="decimal" /><TextField name="frame_rate" label="Frame rate" defaultValue="30" inputMode="numeric" /><TextField name="zoom_speed" label="Zoom speed" defaultValue="3" inputMode="decimal" /></>} />;
    case 'screenshot':
      return <ToolForm {...props} tool="screenshot" submitLabel="Take screenshot" fields={<><UrlField name="url" label="Webpage link" help="Only capture pages you own or have permission to capture." /><TextField name="viewport_width" label="Width" defaultValue="1280" inputMode="numeric" /><TextField name="viewport_height" label="Height" defaultValue="720" inputMode="numeric" /><SelectField name="format" label="Image format" defaultValue="png" options={[['png', 'PNG'], ['jpeg', 'JPEG']]} /><CheckboxField name="full_page" label="Capture full page" /></>} />;
    case 'assStyle':
      return <ToolForm {...props} tool="assStyle" submitLabel="Create style file" fields={<><UrlField name="media_url" label="Media or transcript link" /><TextField name="canvas_width" label="Canvas width" placeholder="1920" inputMode="numeric" /><TextField name="canvas_height" label="Canvas height" placeholder="1080" inputMode="numeric" /><SelectField name="style_preset" label="Style" defaultValue="clean" options={[['clean', 'Clean'], ['bold', 'Bold'], ['karaoke', 'Karaoke/highlight']]} /><TextField name="font_size" label="Font size" placeholder="56" inputMode="numeric" /></>} />;
    case 'jobStatus':
      return <ToolForm {...props} tool="jobStatus" submitLabel="Check job" fields={<TextField name="job_id" label="Job ID" required help="Paste the job_id shown in an earlier long-running result." />} />;
    case 'jobsStatus':
      return <ToolForm {...props} tool="jobsStatus" submitLabel="Show job history" fields={<p className="muted smallNote">This asks the toolkit for recent job status files. No input is needed.</p>} />;
    case 'aiClipDirector':
      return <ToolForm {...props} tool="aiClipDirector" submitLabel="Create short videos" fields={<><div className="aiSetupNote fieldWide"><Sparkles aria-hidden="true" size={18} /><div><strong>AI Clip Factory</strong><p className="muted smallNote">Paste a timestamped transcript and the direct source video link. The Oracle worker uses Codex to choose clip ranges, cuts the video, captions each short, creates a ZIP, and returns one private download link.</p></div></div><UrlField name="source_url" label="Direct source video link" help="Use the downloadable video link you want cut. For YouTube, first use Save from link, then paste the prepared video output here." /><TextAreaField name="transcript" label="Timestamped transcript" rows={10} required placeholder={'00:00:00 Speaker: Opening thought...\n00:01:12 Speaker: Interesting point...'} help="Use transcript output with timestamps when possible. AI needs timestamps to suggest exact cut ranges." /><TextAreaField name="brand_context" label="Brand instructions" rows={5} placeholder={'Audience: beginner creators\nTone: punchy, helpful, no hype\nIntro: quick logo sting or text hook\nOutro: follow for more automation tips'} help="Tell AI your audience, tone, intro/outro wording, and what kind of moments are valuable." /><UrlField name="intro_url" label="Intro video link" required={false} help="Optional. A short branded intro clip to attach before each short." /><UrlField name="outro_url" label="Outro video link" required={false} help="Optional. A short branded outro clip to attach after each short." /><TextField name="clip_count" label="How many shorts" defaultValue="5" inputMode="numeric" /><TextField name="clip_seconds" label="Target seconds per short" defaultValue="45" inputMode="numeric" /><TextField name="intro_outro_seconds" label="Intro/outro seconds" defaultValue="3" inputMode="numeric" /><SelectField name="style_preset" label="Caption style" defaultValue="bold" options={[["clean", "Clean"], ["bold", "Bold"], ["karaoke", "Karaoke/highlight"]]} /></>} />;
  }
}

function ToolForm({ loading, tool, fields, submitLabel, error, onError, onSubmit }: ToolFormProps & { tool: ExecutableToolTabId; fields: ReactNode; submitLabel: string }) {
  const bulkField = urlFieldByTool[tool];
  const [runMode, setRunMode] = useState<'single' | 'bulk'>('single');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const bulkEnabled = Boolean(bulkField && runMode === 'bulk');
    const urlInputs = Array.from(form.querySelectorAll('input[type="url"]')) as HTMLInputElement[];
    const invalidUrl = !bulkEnabled ? urlInputs.find((input) => !input.validity.valid) : undefined;
    if (invalidUrl) {
      onError('Paste a valid public link first.');
      invalidUrl.focus();
      return;
    }

    const numericInput = Array.from(form.querySelectorAll('input[inputmode="numeric"], input[inputmode="decimal"]'))
      .find((input) => {
        const value = (input as HTMLInputElement).value.trim();
        return value.length > 0 && !Number.isFinite(Number(value));
      }) as HTMLInputElement | undefined;
    if (numericInput) {
      onError('Check the number fields. Use digits only, like 12 or 12.5.');
      numericInput.focus();
      return;
    }

    const data = new FormData(form);
    const cookieFile = data.get('youtube_cookie_file');
    if (cookieFile instanceof File && cookieFile.size > 0) {
      if (cookieFile.size > 180_000) {
        onError('The cookie file is too large. Export only YouTube/Google cookies if possible.');
        return;
      }
      data.set('youtube_cookies', await cookieFile.text());
    }
    data.delete('youtube_cookie_file');
    data.delete('bulk_mode');
    const bulkUrlsRaw = data.get('bulk_urls');
    data.delete('bulk_urls');

    const cookieValue = data.get('youtube_cookies');
    if (typeof cookieValue === 'string' && cookieValue.trim()) {
      const lines = cookieValue.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#'));
      const validCookie = lines.some((line) => line.split('\t').length >= 7 && /(^|\.)youtube\.com$|(^|\.)google\.com$|(^|\.)googlevideo\.com$/i.test(line.split('\t')[0] ?? ''));
      if (!validCookie) {
        onError('That does not look like a Netscape-format YouTube cookie export. Use an exported cookies.txt file.');
        return;
      }
    }

    const checkboxValues = Object.fromEntries(Array.from(form.querySelectorAll('input[type="checkbox"]')).map((input) => {
      const checkbox = input as HTMLInputElement;
      return [checkbox.name, checkbox.checked];
    }));
    delete checkboxValues.bulk_mode;
    const baseFields = { ...Object.fromEntries(data.entries()), ...checkboxValues };

    if (bulkEnabled && bulkField) {
      const urls = splitUrlLines(bulkUrlsRaw, 25);
      if (urls.length === 0) {
        onError('Bulk mode needs at least one valid http or https link.');
        return;
      }
      onError(undefined);
      onSubmit(urls.map((url) => buildPayload(tool, { ...baseFields, [bulkField]: url })));
      return;
    }

    onError(undefined);
    onSubmit(buildPayload(tool, baseFields));
  }

  return (
    <form className={runMode === 'bulk' ? 'toolForm bulkMode' : 'toolForm singleMode'} onSubmit={handleSubmit} noValidate>
      {bulkField ? <BulkModeField mode={runMode} onModeChange={setRunMode} /> : null}
      <div className="formGrid">{fields}</div>
      {error ? <p className="formError"><CircleAlert aria-hidden="true" size={16} />{error}</p> : null}
      <div className="buttonRow">
        <button disabled={loading !== null} type="submit">
          {loading === tool ? <Loader2 className="spin" aria-hidden="true" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
          {loading === tool ? 'Working…' : submitLabel}
        </button>
        <p className="muted smallNote"><Clock3 aria-hidden="true" size={16} /> Bigger files can take a little longer. Bulk mode runs links one by one.</p>
      </div>
    </form>
  );
}

function BulkModeField({ mode, onModeChange }: { mode: 'single' | 'bulk'; onModeChange: (mode: 'single' | 'bulk') => void }) {
  return (
    <div className="modeBox fieldWide">
      <div className="modeTabs" role="tablist" aria-label="Run mode">
        <button className={mode === 'single' ? 'modeTab active' : 'modeTab'} onClick={() => onModeChange('single')} role="tab" aria-selected={mode === 'single'} type="button">
          Single link
        </button>
        <button className={mode === 'bulk' ? 'modeTab active' : 'modeTab'} onClick={() => onModeChange('bulk')} role="tab" aria-selected={mode === 'bulk'} type="button">
          Bulk links
        </button>
      </div>
      {mode === 'bulk' ? (
        <div className="bulkBox">
          <p className="muted smallNote">Paste one link per line. The same settings above will be used for every link. Empty lines and duplicate links are ignored.</p>
          <TextAreaField name="bulk_urls" label="Bulk links" placeholder={'https://youtube.com/watch?v=first\nhttps://youtube.com/watch?v=second'} help="Runs up to 25 links per submit, one by one." />
        </div>
      ) : null}
    </div>
  );
}

function YoutubeCookieField() {
  return (
    <div className="cookieBox fieldWide">
      <div>
        <strong>YouTube signed-in helper</strong>
        <p className="muted smallNote">Optional. Use this when YouTube blocks a normal public download. Choose an exported Netscape-format cookies.txt file, or paste its content below. The browser app sends it only with this run and does not save it.</p>
      </div>
      <details className="guideDetails">
        <summary><ChevronDown aria-hidden="true" size={16} /> How to make a cookies.txt file</summary>
        <div className="guideSteps">
          <p><strong>Chrome or Edge</strong></p>
          <ol>
            <li>Open the Chrome Web Store or Microsoft Edge Add-ons.</li>
            <li>Search for a cookies.txt exporter extension that says it exports in Netscape format.</li>
            <li>Install it, then open youtube.com and make sure you are signed in.</li>
            <li>Click the extension and export cookies for the current site, or for YouTube/Google if it offers that choice.</li>
            <li>Save the file as cookies.txt, then choose it here.</li>
          </ol>
          <p><strong>Firefox</strong></p>
          <ol>
            <li>Open Firefox Add-ons.</li>
            <li>Search for a cookies.txt exporter extension that supports Netscape format.</li>
            <li>Open youtube.com and make sure you are signed in.</li>
            <li>Click the extension and export cookies for YouTube/Google.</li>
            <li>Save the file as cookies.txt, then choose it here.</li>
          </ol>
          <p className="muted smallNote">Safety: keep this file private. It can act like a temporary signed-in session. Delete it after use if you do not need it again.</p>
        </div>
      </details>
      <label className="fieldLabel">
        <span>Cookie file <HelpTip text="This must be Netscape cookies.txt format. The app cannot read YouTube cookies automatically from your browser." /></span>
        <input name="youtube_cookie_file" type="file" accept=".txt,text/plain" />
      </label>
      <TextAreaField name="youtube_cookies" label="Or paste cookies.txt content" placeholder={'# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t...'} help="Use this only if choosing a file is not convenient. Do not paste random browser cookie text; it must be Netscape cookies.txt format." />
    </div>
  );
}

function UrlField({ name, label, help = 'Use a direct link that can be opened without signing in.', required = true }: { name: string; label: string; help?: string; required?: boolean }) {
  return (
    <label className="fieldLabel primaryUrlField">
      <span>{label}{help ? <HelpTip text={help} /> : null}</span>
      <input name={name} type="url" placeholder="https://example.com/media.mp4" required={required} />
    </label>
  );
}

function MultiUrlField({ name, label, help }: { name: string; label: string; help: string }) {
  return <TextAreaField name={name} label={label} placeholder={'https://example.com/first.mp4\nhttps://example.com/second.mp4'} required help={help} />;
}

function TextField({ name, label, help, type = 'text', ...inputProps }: { name: string; label: string; help?: string; type?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'>) {
  return (
    <label className="fieldLabel">
      <span>{label}{help ? <HelpTip text={help} /> : null}</span>
      <input name={name} type={type} {...inputProps} />
    </label>
  );
}

function TextAreaField({ name, label, help, ...textareaProps }: { name: string; label: string; help?: string } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  return (
    <label className="fieldLabel fieldWide">
      <span>{label}{help ? <HelpTip text={help} /> : null}</span>
      <textarea name={name} rows={4} {...textareaProps} />
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
  return label.replace(/_url$/i, '').replace(/_/g, ' ').replace(/^response$/i, 'result').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
