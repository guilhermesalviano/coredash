import { NextResponse } from "next/server";
import { MarkReadError, markMessageRead } from "@/features/emails/server/gmail-inbox";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id: string | undefined = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
  }

  try {
    const resolvedId = await markMessageRead(id);
    if (!resolvedId) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    logger.info(`Gmail message ${resolvedId} marked as read`);
    return NextResponse.json({ message: "Marked as read" });
  } catch (error: unknown) {
    const cause = error instanceof MarkReadError ? error.cause : error;
    const status = (cause as { status?: number; code?: number })?.status
      ?? (cause as { status?: number; code?: number })?.code
      ?? 500;
    const message = (cause as { message?: string })?.message ?? "Unknown error";
    const target = error instanceof MarkReadError ? error.resolvedId : id;
    logger.error(`Failed to mark Gmail message ${target} as read: [${status}] ${message}`);
    // 403 = insufficient OAuth scope — token must be regenerated with gmail.modify scope
    return NextResponse.json({ error: "Failed to mark message as read", detail: message }, { status: 500 });
  }
}
