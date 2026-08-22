import { describe, expect, it } from 'vitest';
import { corsOptions } from '../src/middleware/security.js';

describe('corsOptions', () => {
  it('does not use wildcard origin', () => {
    expect(corsOptions.origin).not.toBe('*');
  });
});
