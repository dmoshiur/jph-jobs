import { describe, expect, it } from 'vitest';
import { resolveTier } from '../src/modules/jobs/job-tier.js';

describe('resolveTier', () => {
  it('defaults to FREE when no package', () => {
    expect(resolveTier(null)).toBe('FREE');
    expect(resolveTier(undefined)).toBe('FREE');
    expect(resolveTier({ slug: 'something-else', features: [] })).toBe('FREE');
  });

  it('resolves HOT from slug', () => {
    expect(resolveTier({ slug: 'hot-urgent' })).toBe('HOT');
  });

  it('resolves FEATURED from slug', () => {
    expect(resolveTier({ slug: 'featured-job' })).toBe('FEATURED');
  });

  it('resolves BASIC from slug', () => {
    expect(resolveTier({ slug: 'basic-plan' })).toBe('BASIC');
  });

  it('resolves tier from feature when slug is generic', () => {
    expect(resolveTier({ slug: 'plan-x', features: [{ key: 'tier', value: 'HOT' }] })).toBe('HOT');
    expect(resolveTier({ slug: 'plan-y', features: [{ key: 'tier', value: 'FEATURED' }] })).toBe('FEATURED');
  });

  it('HOT slug takes priority over FEATURED', () => {
    expect(resolveTier({ slug: 'hot-featured' })).toBe('HOT');
  });
});
