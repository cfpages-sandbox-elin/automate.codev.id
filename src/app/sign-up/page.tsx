import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">Cloudflare Pages build</p>
        <h1>Sign-up page placeholder</h1>
        <p className="muted">
          This static Cloudflare Pages package is optimized for easiest deployment first. Add Clerk/Cloudflare Access back after the Pages deployment is stable.
        </p>
        <Link href="/">Back to dashboard</Link>
      </section>
    </main>
  );
}
