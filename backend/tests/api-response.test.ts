import { describe, expect, it, vi } from 'vitest';
import { ok, fail } from '../src/utils/api-response.js';

function mockResponse() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}

describe('api response helpers', () => {
  it('returns standard success format', () => {
    const res = mockResponse();
    ok(res, { status: 'ok' }, 'Healthy');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Healthy', data: { status: 'ok' } });
  });

  it('returns standard error format', () => {
    const res = mockResponse();
    fail(res, 'Invalid', { field: 'email' }, 422);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid', errors: { field: 'email' } });
  });
});
