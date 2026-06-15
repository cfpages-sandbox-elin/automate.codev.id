'use client';

import { UserButton } from '@clerk/clerk-react';
import { clerkIsConfigured } from '@/lib/admin-auth';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AccountMenu() {
  if (!clerkIsConfigured(publishableKey)) return null;
  return <UserButton afterSignOutUrl="/" />;
}
