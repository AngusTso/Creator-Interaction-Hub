import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../.env') });

export const port = Number(process.env.PORT ?? 3000);

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters.');
  }

  return new TextEncoder().encode(secret);
}

export function getTrustProxyHops(): number {
  const configuredHops = process.env.TRUST_PROXY_HOPS;
  if (configuredHops === undefined) {
    return 0;
  }

  const hops = Number(configuredHops);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
  }

  return hops;
}
