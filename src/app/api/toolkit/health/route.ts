import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getToolkitConfigFromEnv, getToolkitHealth } from '@/lib/toolkit-client';

export async function GET() {
  await auth.protect();
  const result = await getToolkitHealth(getToolkitConfigFromEnv());
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
