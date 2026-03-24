import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

function toBuffer(value: string) {
  return Buffer.from(value, 'utf8');
}

export function generateOneTimeCode() {
  return String(randomInt(100000, 1000000));
}

export function generateToken() {
  return randomBytes(32).toString('hex');
}

export function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function safeEqual(left: string, right: string) {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
