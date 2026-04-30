import { NextResponse } from "next/server";
import { requireActorFromSession } from "@/lib/auth-context";
import { finalizeMediaUpload } from "@/lib/services/media";
import { buildMediaKey, saveFile } from "@/lib/storage/r2";
import { isAppError, toSafeError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp",
  "image/avif", "image/gif", "image/svg+xml",
  "application/pdf",
]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const actor = await requireActorFromSession();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
    }

    const key = buildMediaKey(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveFile(key, buffer);

    const row = await finalizeMediaUpload(actor, {
      key,
      mime: file.type,
      sizeBytes: file.size,
    });

    return NextResponse.json(row);
  } catch (e) {
    const safe = toSafeError(e);
    return NextResponse.json(
      { error: safe.message, code: safe.code },
      { status: isAppError(e) ? e.status : 500 },
    );
  }
}
