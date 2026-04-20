import { NextResponse } from "next/server";
import { requireActorFromSession } from "@/lib/auth-context";
import { presignMediaUpload } from "@/lib/services/media";
import { isAppError, toSafeError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const actor = await requireActorFromSession();
    const body = await req.json();
    const result = await presignMediaUpload(actor, body);
    return NextResponse.json(result);
  } catch (e) {
    const safe = toSafeError(e);
    return NextResponse.json(
      { error: safe.message, code: safe.code },
      { status: isAppError(e) ? e.status : 500 },
    );
  }
}
