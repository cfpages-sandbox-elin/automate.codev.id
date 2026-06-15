import { describe, expect, it } from 'vitest';
import { clerkIsConfigured, isAdminMetadata } from './admin-auth';

describe('admin auth helpers', () => {
  it('accepts only public metadata role admin', () => {
    expect(isAdminMetadata({ role: 'admin' })).toBe(true);
    expect(isAdminMetadata({ role: 'user' })).toBe(false);
    expect(isAdminMetadata({ roles: ['admin'] })).toBe(false);
    expect(isAdminMetadata(null)).toBe(false);
  });

  it('treats missing or invalid publishable keys as unconfigured', () => {
    expect(clerkIsConfigured('pk_test_abc')).toBe(true);
    expect(clerkIsConfigured('pk_live_abc')).toBe(true);
    expect(clerkIsConfigured('')).toBe(false);
    expect(clerkIsConfigured(undefined)).toBe(false);
  });
});
