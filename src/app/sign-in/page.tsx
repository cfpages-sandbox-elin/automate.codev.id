'use client';

import { SignIn } from '@clerk/clerk-react';
import { clerkIsConfigured } from '@/lib/admin-auth';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  if (!clerkIsConfigured(publishableKey)) {
    return (
      <main className="authShell">
        <section className="authCard">
          <p className="eyebrow">Setup needed</p>
          <h1>Login is almost ready.</h1>
          <p className="muted">Add the Clerk keys in Cloudflare Pages, then redeploy.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="authShell">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </main>
  );
}
