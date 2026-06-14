import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getToolkitConfigFromEnv, runToolkitInstallTest } from '@/lib/toolkit-client';

export async function POST() {
  await auth.protect();
  const result = await runToolkitInstallTest(getToolkitConfigFromEnv());
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
