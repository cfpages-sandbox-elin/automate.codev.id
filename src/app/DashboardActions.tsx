'use client';

import { useState } from 'react';

type ToolkitResult = {
  ok: boolean;
  status: number;
  message: string;
  endpoint?: string;
  resultUrl?: string;
};

async function readJson(response: Response): Promise<ToolkitResult> {
  const data = (await response.json()) as ToolkitResult;
  return { ...data, ok: response.ok && data.ok };
}

export function DashboardActions() {
  const [health, setHealth] = useState<ToolkitResult | null>(null);
  const [smoke, setSmoke] = useState<ToolkitResult | null>(null);
  const [loading, setLoading] = useState<'health' | 'smoke' | null>(null);

  async function checkHealth() {
    setLoading('health');
    try {
      setHealth(await readJson(await fetch('/api/toolkit/health', { cache: 'no-store' })));
    } finally {
      setLoading(null);
    }
  }

  async function runSmokeTest() {
    setLoading('smoke');
    try {
      setSmoke(await readJson(await fetch('/api/toolkit/smoke-test', { method: 'POST' })));
      await checkHealth();
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Live backend checks</p>
          <h2>Toolkit API status</h2>
        </div>
        <span className={health?.ok ? 'pill ok' : 'pill warn'}>{health?.ok ? 'Connected' : 'Needs attention'}</span>
      </div>

      <div className="buttonRow">
        <button onClick={checkHealth} disabled={loading !== null}>{loading === 'health' ? 'Checking…' : 'Check backend health'}</button>
        <button className="secondary" onClick={runSmokeTest} disabled={loading !== null}>{loading === 'smoke' ? 'Testing R2…' : 'Run R2 smoke test'}</button>
      </div>

      <div className="resultGrid">
        <ResultCard title="Health check" result={health} />
        <ResultCard title="R2 smoke test" result={smoke} />
      </div>
    </section>
  );
}

function ResultCard({ title, result }: { title: string; result: ToolkitResult | null }) {
  if (!result) {
    return <div className="resultCard mutedBox"><h3>{title}</h3><p>No result yet.</p></div>;
  }
  return (
    <div className="resultCard">
      <h3>{title}</h3>
      <p><strong>Status:</strong> {result.ok ? 'OK' : 'Problem'} ({result.status})</p>
      <p><strong>Message:</strong> {result.message}</p>
      {result.resultUrl ? <p><strong>Output:</strong> <a href={result.resultUrl} target="_blank" rel="noreferrer">Open R2 output</a></p> : null}
    </div>
  );
}
