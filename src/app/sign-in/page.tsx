import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">Cloudflare Pages build</p>
        <h1>Sign-in page placeholder</h1>
        <p className="muted">
          This static Cloudflare Pages package removes the Next.js server-side Clerk middleware so it can deploy cleanly to Pages.
          Backend calls are still protected by the server-side Pages Function secret.
        </p>
        <Link href="/">Back to dashboard</Link>
      </section>
    </main>
  );
}
