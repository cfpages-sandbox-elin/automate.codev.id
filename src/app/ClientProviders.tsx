'use client';

import { ClerkProvider } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import { clerkIsConfigured } from '@/lib/admin-auth';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClientProviders({ children }: { children: ReactNode }) {
  const key = publishableKey;
  if (!clerkIsConfigured(key)) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={key}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
