import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">Protected app</p>
        <h1>Sign in to automate.codev.id</h1>
        <p className="muted">Use the shared codev.id Clerk login to access the toolkit UI.</p>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </section>
    </main>
  );
}
