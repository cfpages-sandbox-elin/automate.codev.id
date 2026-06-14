import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">Coming soon</p>
        <h1>Accounts are not open yet.</h1>
        <p className="muted">
          For now, use the studio directly. Later, accounts will help you save history, organize outputs, and manage private workspaces.
        </p>
        <Link className="buttonLike" href="/">Open Automate Studio</Link>
      </section>
    </main>
  );
}
