import { requireAdmin } from '../../_auth.js';

const MAX_TRANSCRIPT_CHARS = 120000;

function sanitizeText(value, maxLength = 4000) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, maxLength)
    : '';
}

function sanitizeNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

async function callOracle(context, path, body) {
  const env = context.env || {};
  const baseUrl = env.ORACLE_BACKEND_BASE_URL || 'https://api.codev.id';
  const token = env.ORACLE_BACKEND_PROXY_SECRET || env.CODEV_API_PROXY_TOKEN;
  if (!token) throw new Error('Backend secret is missing.');
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Backend request failed with HTTP ${response.status}`);
  return data;
}

function readResultUrl(raw) {
  const response = raw?.response;
  if (typeof response === 'string' && /^https?:\/\//i.test(response)) return response;
  if (response && typeof response === 'object') {
    for (const key of ['url', 'media_url', 'video_url', 'download_url', 'captioned_video_url']) {
      const value = response[key];
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
    }
  }
  return undefined;
}

function buildClipPrompt(input) {
  return `You are an expert short-form video editor. Analyze this timestamped transcript and choose the strongest moments for short videos.

Return ONLY valid JSON with this shape:
{
  "clips": [
    {
      "title": "short clear title",
      "start": "HH:MM:SS",
      "end": "HH:MM:SS",
      "hook": "why this moment is interesting",
      "caption_angle": "how captions should frame this clip",
      "intro_text": "very short branded intro overlay",
      "outro_text": "very short branded outro overlay",
      "cut_tool_hint": "start, end"
    }
  ],
  "workflow": ["plain English next step"]
}

Rules:
- Pick ${input.clip_count} clips if the transcript has enough good moments.
- Aim for about ${input.clip_seconds} seconds per clip.
- Avoid weak introductions, dead air, filler, and context that does not stand alone.
- Prefer clips with a strong hook, a useful lesson, a surprising opinion, a clear story turn, or a quotable line.
- Make start/end timestamps usable in a video cutting tool.
- Include intro/outro wording that fits ${input.intro_outro_seconds}-second branding moments.
- Caption style preference: ${input.style_preset}.
- Source video link, if supplied: ${input.source_url || 'not supplied'}.

Brand instructions:
${input.brand_context || 'No brand instructions supplied. Use a helpful, concise creator tone.'}

Transcript:
${input.transcript}`;
}

function fallbackSetupResponse(input) {
  return Response.json({
    code: 412,
    message: 'AI is not configured yet. Add a server-side AI API key, or paste this prompt into ChatGPT Plus manually.',
    response: {
      setup_needed: true,
      why: 'ChatGPT Plus works in the ChatGPT app, but this web app needs a server-side API key to call AI automatically.',
      accepted_secrets: ['OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'AI_API_KEY'],
      suggested_model_secret: 'AI_MODEL',
      copy_to_chatgpt_prompt: buildClipPrompt(input),
      next_steps: [
        'Paste the prompt into ChatGPT Plus to get clip ranges now.',
        'For full in-app automation, add an AI API key as a Cloudflare Pages secret.',
        'After AI returns ranges, open Cut clip for each range, then Caption video for each output.',
      ],
    },
  }, { status: 200 });
}

function extractJsonObject(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI did not return JSON.');
  return JSON.parse(match[0]);
}

function normalizePlan(plan) {
  const clips = Array.isArray(plan?.clips) ? plan.clips.slice(0, 12).map((clip) => ({
    title: sanitizeText(clip?.title, 120) || 'Untitled clip',
    start: sanitizeText(clip?.start, 20),
    end: sanitizeText(clip?.end, 20),
    hook: sanitizeText(clip?.hook, 500),
    caption_angle: sanitizeText(clip?.caption_angle, 300),
    intro_text: sanitizeText(clip?.intro_text, 160),
    outro_text: sanitizeText(clip?.outro_text, 160),
    cut_tool_hint: sanitizeText(clip?.cut_tool_hint, 80),
  })).filter((clip) => clip.start && clip.end) : [];
  const workflow = Array.isArray(plan?.workflow) ? plan.workflow.map((item) => sanitizeText(item, 220)).filter(Boolean).slice(0, 12) : [];
  return { clips, workflow };
}

function providerConfig(env) {
  if (env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/responses',
      key: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || env.AI_MODEL || 'gpt-4.1-mini',
    };
  }
  const openRouterKey = env.OPENROUTER_API_KEY || (env.AI_PROVIDER === 'openrouter' ? env.AI_API_KEY : undefined);
  if (openRouterKey) {
    return {
      provider: 'openrouter',
      endpoint: env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: env.OPENROUTER_MODEL || env.AI_MODEL || 'openai/gpt-4.1-mini',
    };
  }
  if (env.AI_API_KEY && env.AI_BASE_URL) {
    return {
      provider: env.AI_PROVIDER || 'openai-compatible',
      endpoint: `${env.AI_BASE_URL.replace(/\/+$/, '')}/chat/completions`,
      key: env.AI_API_KEY,
      model: env.AI_MODEL || 'gpt-4.1-mini',
    };
  }
  return undefined;
}

async function callOpenAI(config, prompt) {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: 'You return strict JSON for video editing plans. No markdown.' }] },
        { role: 'user', content: [{ type: 'input_text', text: prompt }] },
      ],
      text: { format: { type: 'json_object' } },
    }),
  });
  const data = await response.json().catch(() => ({}));
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('\n') || '';
  if (!response.ok) throw new Error(data.error?.message || `OpenAI request failed with HTTP ${response.status}`);
  return text;
}

async function callChatCompletions(config, prompt) {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.key}`,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://automate.codev.id',
      'X-Title': 'Automate Studio AI Clip Director',
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You return strict JSON for video editing plans. No markdown.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `AI request failed with HTTP ${response.status}`);
  return data.choices?.[0]?.message?.content || '';
}

async function createShortVideos(context, input, plan) {
  if (!input.source_url) throw new Error('Direct source video link is required before automatic cutting can run.');
  const finalClips = [];
  for (const [index, clip] of plan.clips.entries()) {
    const cut = await callOracle(context, '/nca/video/trim', {
      video_url: input.source_url,
      start: clip.start,
      end: clip.end,
      video_crf: 23,
      audio_bitrate: '128k',
    });
    const cutUrl = readResultUrl(cut);
    if (!cutUrl) throw new Error(`Clip ${index + 1} was cut but no output URL was returned.`);

    let brandedUrl = cutUrl;
    let join;
    const videoUrls = [input.intro_url, cutUrl, input.outro_url].filter(Boolean).map((video_url) => ({ video_url }));
    if (videoUrls.length > 1) {
      join = await callOracle(context, '/nca/video/concatenate', { video_urls: videoUrls });
      brandedUrl = readResultUrl(join) || brandedUrl;
    }

    const caption = await callOracle(context, '/nca/video/caption', {
      video_url: brandedUrl,
      language: input.language || 'auto',
      settings: input.style_settings,
    });
    const finalUrl = readResultUrl(caption) || brandedUrl;
    finalClips.push({
      ...clip,
      cut_url: cutUrl,
      branded_url: brandedUrl,
      final_url: finalUrl,
      cut_response: cut,
      join_response: join,
      caption_response: caption,
    });
  }
  return finalClips;
}

export const onRequestPost = async (context) => {
  const auth = await requireAdmin(context);
  if (auth) return auth;

  const body = await readJsonBody(context.request);
  const input = {
    source_url: sanitizeText(body.source_url, 2048),
    intro_url: sanitizeText(body.intro_url, 2048),
    outro_url: sanitizeText(body.outro_url, 2048),
    transcript: sanitizeText(body.transcript, MAX_TRANSCRIPT_CHARS),
    brand_context: sanitizeText(body.brand_context, 4000),
    clip_count: sanitizeNumber(body.clip_count, 5, 1, 12),
    clip_seconds: sanitizeNumber(body.clip_seconds, 45, 10, 180),
    intro_outro_seconds: sanitizeNumber(body.intro_outro_seconds, 3, 0, 15),
    style_preset: sanitizeText(body.style_preset, 40) || 'bold',
  };
  input.style_settings = input.style_preset === 'karaoke'
    ? { style: 'karaoke', font_size: 56, max_words_per_line: 5 }
    : input.style_preset === 'bold'
      ? { style: 'highlight', font_size: 64, max_words_per_line: 5, bold: true }
      : { style: 'classic', font_size: 48, max_words_per_line: 6 };

  if (!input.transcript || input.transcript.length < 40) {
    return Response.json({ code: 400, message: 'Paste a timestamped transcript first.' }, { status: 200 });
  }
  if (!input.source_url) {
    return Response.json({ code: 400, message: 'Paste the direct source video link first so the factory knows what to cut.' }, { status: 200 });
  }

  const config = providerConfig(context.env || {});
  if (!config) return fallbackSetupResponse(input);

  const prompt = buildClipPrompt(input);
  try {
    const aiText = config.provider === 'openai' ? await callOpenAI(config, prompt) : await callChatCompletions(config, prompt);
    const plan = normalizePlan(extractJsonObject(aiText));
    if (plan.clips.length === 0) throw new Error('AI did not return any usable clip ranges.');
    const finalClips = await createShortVideos(context, input, plan);

    return Response.json({
      code: 200,
      message: 'AI short-video factory finished.',
      response: {
        provider: config.provider,
        model: config.model,
        clips: finalClips,
        final_video_urls: finalClips.map((clip) => clip.final_url).filter(Boolean),
        workflow: plan.workflow.length > 0 ? plan.workflow : [
          'AI selected the clip ranges.',
          'The app cut each range from the source video.',
          'The app attached intro/outro clips when supplied.',
          'The app captioned each finished short.',
        ],
        zip_status: 'Individual short-video links are ready. Single ZIP packaging still needs the Oracle ZIP packager worker before a verified ZIP URL can be returned.',
        next_worker_needed: 'zip-packager',
      },
    }, { status: 200 });
  } catch (error) {
    return Response.json({
      code: 502,
      message: 'AI could not create a clip plan yet.',
      response: {
        error: error instanceof Error ? error.message : 'unknown AI error',
        copy_to_chatgpt_prompt: prompt,
      },
    }, { status: 200 });
  }
};
