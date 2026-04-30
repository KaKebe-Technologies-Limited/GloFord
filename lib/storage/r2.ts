import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");

export function buildMediaKey(originalName: string): string {
  const safe = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

export function publicUrlFor(key: string): string {
  return `/api/media/file/${key}`;
}

export async function saveFile(key: string, buffer: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, key), buffer);
}

export function uploadDir(): string {
  return UPLOAD_DIR;
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, key));
  } catch {
    // file already gone — ignore
  }
}
