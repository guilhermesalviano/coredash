import { NextResponse } from "next/server";
import { getMessage } from "@/features/emails/server/gmail-inbox";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing required route param: id" }, { status: 400 });
  }

  try {
    const result = await getMessage(id);
    if (!result) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (result.fromCache) {
      logger.info(`Gmail message ${result.resolvedId} retrieved from cache`);
      return formatResponse(request, { message: "Email retrieved from cache", data: result.data });
    }

    return formatResponse(request, { message: "Email retrieved successfully", data: result.data });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to retrieve Gmail message" }, { status: 500 });
  }
}
