import { DashboardActions } from './DashboardActions';

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">NCA Toolkit Web Studio</p>
          <h1>Media automation from one compact dashboard.</h1>
          <p className="heroText">
            Pick a tab, paste a public media URL, and let the private Oracle toolkit do the heavy work. API keys and R2 secrets stay server-side.
          </p>
        </div>
        <a className="buttonLike" href="https://api.codev.id/healthz" target="_blank" rel="noreferrer">API health</a>
      </header>

      <section className="grid three">
        <div className="statCard">
          <span className="statLabel">Available now</span>
          <strong>6 tabs</strong>
          <p>Status, metadata, MP3 conversion, transcription, thumbnail, and video trim workflows.</p>
        </div>
        <div className="statCard">
          <span className="statLabel">Storage</span>
          <strong>Cloudflare R2</strong>
          <p>File outputs return R2 links when the underlying toolkit produces a cloud result.</p>
        </div>
        <div className="statCard">
          <span className="statLabel">Safety</span>
          <strong>Allowlisted API</strong>
          <p>The raw toolkit and dangerous Python execution endpoint stay hidden behind the narrow backend proxy.</p>
        </div>
      </section>

      <DashboardActions />

      <section className="panel advice">
        <p className="eyebrow">Tips</p>
        <ul>
          <li>Use direct public media URLs. Private Google Drive, YouTube pages, or login-only URLs may fail.</li>
          <li>Start with metadata before long conversions so you know the file is reachable.</li>
          <li>Transcription and video trim can take longer than health checks because the server downloads and processes media.</li>
        </ul>
      </section>
    </main>
  );
}
