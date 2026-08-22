import crypto from 'node:crypto';

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function secureRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function timingSafeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
