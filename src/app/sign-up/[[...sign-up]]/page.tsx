import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">Protected app</p>
        <h1>Create access</h1>
        <p className="muted">Accounts are handled by Clerk for the shared codev.id login layer.</p>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </section>
    </main>
  );
}
