'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { clerkIsConfigured, isAdminMetadata } from '@/lib/admin-auth';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AdminGate({ children }: { children: ReactNode }) {
  if (!clerkIsConfigured(publishableKey)) {
    return (
      <main className="authShell">
        <section className="authCard">
          <p className="eyebrow">Setup needed</p>
          <h1>Login is almost ready.</h1>
          <p className="muted">
            Add the Clerk keys in Cloudflare Pages, then redeploy. After that, only admins can open Automate Studio.
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="authShell">
          <section className="authCard">
            <p className="eyebrow">Admin access</p>
            <h1>Sign in to use Automate Studio.</h1>
            <p className="muted">This tool is private. Use the admin account to continue.</p>
            <SignInButton mode="redirect">
              <button type="button"><ShieldCheck aria-hidden="true" size={18} /> Sign in</button>
            </SignInButton>
          </section>
        </main>
      </SignedOut>
      <SignedIn>
        <AdminOnly>{children}</AdminOnly>
      </SignedIn>
    </>
  );
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <main className="authShell">
        <section className="authCard"><p className="muted">Checking access…</p></section>
      </main>
    );
  }

  if (!isAdminMetadata(user?.publicMetadata)) {
    return (
      <main className="authShell">
        <section className="authCard">
          <div className="authTopper"><UserButton afterSignOutUrl="/" /></div>
          <p className="eyebrow">Admin only</p>
          <h1>You do not have access yet.</h1>
          <p className="muted">Ask an admin to add the admin role to this account, then refresh the page.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
