import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM helpers for encrypting sensitive config at rest.
 *
 * The master key is 32 random bytes, base64-encoded, stored in the
 * ENCRYPTION_KEY env var. Rotating the key requires decrypting with
 * the old key and re-encrypting with the new one — out of scope for
 * this file.
 *
 * Output format (all base64): iv(12) | authTag(16) | ciphertext
 */

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function loadKey(): Buffer {
  const b64 = process.env.ENCRYPTION_KEY;
  if (!b64) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate with `openssl rand -base64 32` and add to .env.local.",
    );
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (base64 of 32 raw bytes).");
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(payload: string): string {
  const key = loadKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error("Encrypted payload is too short");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T = unknown>(payload: string): T {
  return JSON.parse(decrypt(payload)) as T;
}
