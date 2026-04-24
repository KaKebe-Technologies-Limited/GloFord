import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 via the S3-compatible API.
 *
 * Object keys are namespaced by orgId to keep bucket contents tidy
 * and to make per-org retention policies trivial to apply later.
 */

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const publicUrl = process.env.R2_PUBLIC_URL;

let cachedClient: S3Client | null = null;

function getClient() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return cachedClient;
}

export function buildMediaKey(originalName: string): string {
  const safe = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

export function publicUrlFor(key: string): string {
  if (!publicUrl) throw new Error("R2_PUBLIC_URL is not set");
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

export async function presignUpload(params: { key: string; mime: string; expiresSeconds?: number }) {
  const client = getClient();
  const cmd = new PutObjectCommand({
    Bucket: bucket!,
    Key: params.key,
    ContentType: params.mime,
  });
  return getSignedUrl(client, cmd, { expiresIn: params.expiresSeconds ?? 300 });
}

export async function deleteObject(key: string) {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }));
}
