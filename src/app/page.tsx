import { CheckCircle2, Clock3, FileVideo2 } from 'lucide-react';
import { DashboardActions } from './DashboardActions';
import { ThemeToggle } from './ThemeToggle';

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Automate Studio</p>
          <h1>Turn media links into useful files.</h1>
          <p className="heroText">
            Paste a video or audio link, choose what you want, and get a ready-to-use result. No technical setup needed.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="featureStrip" aria-label="What this app can help with">
        <div className="featureCard">
          <span className="featureIcon"><FileVideo2 aria-hidden="true" size={20} /></span>
          <div>
            <strong>Convert and trim media</strong>
            <p>Make MP3 files, cut clips, or grab a thumbnail from a video.</p>
          </div>
        </div>
        <div className="featureCard">
          <span className="featureIcon"><CheckCircle2 aria-hidden="true" size={20} /></span>
          <div>
            <strong>Create useful outputs</strong>
            <p>Generate transcripts, subtitles, download links, and file details.</p>
          </div>
        </div>
        <div className="featureCard">
          <span className="featureIcon"><Clock3 aria-hidden="true" size={20} /></span>
          <div>
            <strong>Built for quick checks</strong>
            <p>Start with a simple link check before running longer jobs.</p>
          </div>
        </div>
      </section>

      <DashboardActions />
    </main>
  );
}
