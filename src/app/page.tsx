import { DashboardActions } from './DashboardActions';

const toolCards = [
  {
    title: 'Media to MP3',
    status: 'Next',
    description: 'Paste a media URL and get a clean MP3 file in R2.',
  },
  {
    title: 'Transcribe media',
    status: 'Next',
    description: 'Use local Whisper in the toolkit container instead of a paid transcription API.',
  },
  {
    title: 'Video trim and thumbnail',
    status: 'Planned',
    description: 'Guided forms for common FFmpeg jobs with plain-English options.',
  },
  {
    title: 'Raw Python execution',
    status: 'Hidden',
    description: 'Intentionally hidden because it can run arbitrary code on the server.',
  },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">NCA Toolkit Web Studio</p>
          <h1>Media automation without wrestling n8n HTTP nodes.</h1>
          <p className="heroText">
            This Cloudflare Pages UI talks to a narrow Oracle backend proxy. Secrets stay server-side; the raw toolkit API stays private.
          </p>
        </div>
        <a className="buttonLike" href="https://api.codev.id/healthz" target="_blank" rel="noreferrer">API health</a>
      </header>

      <section className="grid three">
        <div className="statCard">
          <span className="statLabel">Raw API exposure</span>
          <strong>Localhost only</strong>
          <p>Toolkit API stays on 127.0.0.1:8088. Cloudflare Pages calls the narrow api.codev.id proxy.</p>
        </div>
        <div className="statCard">
          <span className="statLabel">Storage</span>
          <strong>Cloudflare R2</strong>
          <p>Outputs go to the automate-codev bucket and public assets domain when requested.</p>
        </div>
        <div className="statCard">
          <span className="statLabel">Access</span>
          <strong>Protected backend</strong>
          <p>Pages Functions use a server-side bearer token. Do not expose that token to browser JavaScript.</p>
        </div>
      </section>

      <DashboardActions />

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Noob-friendly forms</p>
            <h2>Tool roadmap</h2>
          </div>
          <span className="pill">v1 foundation</span>
        </div>
        <div className="grid two">
          {toolCards.map((tool) => (
            <article className="toolCard" key={tool.title}>
              <div className="toolTitleRow">
                <h3>{tool.title}</h3>
                <span className="miniPill">{tool.status}</span>
              </div>
              <p>{tool.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel advice">
        <p className="eyebrow">Safety reminders</p>
        <ul>
          <li>The raw Python execution endpoint remains hidden.</li>
          <li>Only narrow allowlisted API proxy routes should be exposed.</li>
          <li>Prefer private presigned links later for sensitive outputs.</li>
        </ul>
      </section>
    </main>
  );
}
