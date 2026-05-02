import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// StorageBackend interface
// ---------------------------------------------------------------------------

interface StorageBackend {
  saveFile(key: string, buffer: Buffer): Promise<void>;
  deleteObject(key: string): Promise<void>;
  publicUrlFor(key: string): string;
}

// ---------------------------------------------------------------------------
// LocalBackend — default, no env vars required
// ---------------------------------------------------------------------------

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");

class LocalBackend implements StorageBackend {
  async saveFile(key: string, buffer: Buffer): Promise<void> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, key), buffer);
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await unlink(join(UPLOAD_DIR, key));
    } catch {
      // file already gone — ignore
    }
  }

  publicUrlFor(key: string): string {
    return `/api/media/file/${key}`;
  }
}

// ---------------------------------------------------------------------------
// R2Backend — activated when all four R2 env vars are present
// ---------------------------------------------------------------------------

class R2Backend implements StorageBackend {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    publicUrl: string,
  ) {
    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/$/, ""); // strip trailing slash

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async saveFile(key: string, buffer: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      // object already gone — ignore
    }
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

// ---------------------------------------------------------------------------
// Backend selection — R2 wins only when ALL four required vars are present
// ---------------------------------------------------------------------------

function resolveBackend(): StorageBackend {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (accountId && accessKeyId && secretAccessKey && bucket) {
    const publicUrl = process.env.R2_PUBLIC_URL ?? "";
    return new R2Backend(accountId, accessKeyId, secretAccessKey, bucket, publicUrl);
  }

  return new LocalBackend();
}

export const storage: StorageBackend = resolveBackend();

// ---------------------------------------------------------------------------
// Utility — key generation (backend-agnostic)
// ---------------------------------------------------------------------------

export function buildMediaKey(originalName: string): string {
  const safe = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

// ---------------------------------------------------------------------------
// Legacy top-level exports — thin wrappers over the active backend
// Callers do not need to change.
// ---------------------------------------------------------------------------

export function publicUrlFor(key: string): string {
  return storage.publicUrlFor(key);
}

export async function saveFile(key: string, buffer: Buffer): Promise<void> {
  return storage.saveFile(key, buffer);
}

export async function deleteObject(key: string): Promise<void> {
  return storage.deleteObject(key);
}

/** Local-only — returns the filesystem upload directory used by the file-serve route. */
export function uploadDir(): string {
  return UPLOAD_DIR;
}
