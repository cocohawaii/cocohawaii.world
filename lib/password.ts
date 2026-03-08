import crypto from 'crypto';

const SALT_LEN = 16;
const KEY_LEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTIONS);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTIONS);
  const actual = Buffer.from(hashHex, 'hex');
  return crypto.timingSafeEqual(expected, actual);
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
