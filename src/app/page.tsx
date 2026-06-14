import { UserButton } from '@clerk/nextjs';
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
            This UI keeps the toolkit API key and R2 secrets on the server, then gives you safe buttons and forms in the browser.
          </p>
        </div>
        <UserButton />
      </header>

      <section className="grid three">
        <div className="statCard">
          <span className="statLabel">Raw API exposure</span>
          <strong>Localhost only</strong>
          <p>Toolkit API stays on 127.0.0.1:8088; browser users call this web app instead.</p>
        </div>
        <div className="statCard">
          <span className="statLabel">Storage</span>
          <strong>Cloudflare R2</strong>
          <p>Outputs go to the automate-codev bucket and public assets domain when requested.</p>
        </div>
        <div className="statCard">
          <span className="statLabel">Access</span>
          <strong>Clerk login</strong>
          <p>Shared codev.id application login protects the UI and server-side API proxy routes.</p>
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
        <p className="eyebrow">Optimization suggestions I will keep checking</p>
        <ul>
          <li>Add Docker log rotation before heavy use so logs do not fill the 45 GB boot disk.</li>
          <li>Keep queue length conservative until real media job RAM and disk usage is measured.</li>
          <li>Prefer private presigned links for sensitive outputs; public R2 links are convenient but anyone with the URL can view them.</li>
          <li>Hide dangerous endpoints, especially Python code execution, unless you explicitly approve them later.</li>
        </ul>
      </section>
    </main>
  );
}
