import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in is not required yet.</h1>
        <p className="muted">
          You can use Automate Studio from the home page. Account access will be added later when saved history and private workspaces are ready.
        </p>
        <Link className="buttonLike" href="/">Open Automate Studio</Link>
      </section>
    </main>
  );
}
