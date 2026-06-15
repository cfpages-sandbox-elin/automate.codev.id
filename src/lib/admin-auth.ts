export type PublicMetadata = Record<string, unknown> | null | undefined;

export function isAdminMetadata(metadata: PublicMetadata): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  return metadata.role === 'admin';
}

export function clerkIsConfigured(publishableKey?: string): publishableKey is string {
  return Boolean(publishableKey && publishableKey.trim().startsWith('pk_'));
}
