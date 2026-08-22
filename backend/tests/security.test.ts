import { describe, expect, it } from 'vitest';
import { sha256, secureRandomToken, timingSafeEqual } from '../src/utils/security.js';
import { slugify } from '../src/utils/slug.js';

describe('security helpers', () => {
  it('produces a stable sha256 hex digest', () => {
    const digest = sha256('hello');
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256('hello')).toBe(digest);
    expect(sha256('hellp')).not.toBe(digest);
  });

  it('generates random tokens of expected byte length', () => {
    expect(secureRandomToken(16)).toMatch(/^[a-f0-9]{32}$/);
    expect(secureRandomToken(32)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('compares strings in constant time without throwing on mismatched length', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('short', 'longer-string')).toBe(false);
  });
});

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    expect(slugify('Sales Executive')).toBe('sales-executive');
    expect(slugify('  Multiple   Spaces ')).toBe('multiple-spaces');
  });
});
