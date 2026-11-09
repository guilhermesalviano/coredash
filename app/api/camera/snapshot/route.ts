import { NextRequest, NextResponse } from "next/server";

import { getCameraSnapshot } from "@/features/camera/server/get-camera-snapshot";
import { AppError } from "@/lib/api-error";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Returns the latest camera frame as an image; failures use the JSON envelope. */
export async function GET(req: NextRequest) {
  try {
    const frame = await getCameraSnapshot();
    return new NextResponse(new Uint8Array(frame.body), {
      status: 200,
      headers: {
        "Content-Type": frame.contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      // The card polls every couple of seconds, so an offline camera must not flood the log.
      if (error.status !== 404) logger.debug(`Camera snapshot failed: ${error.message}`);
      return formatResponse(req, { error: error.message, reason: error.reason }, { status: error.status });
    }
    logger.error("Camera snapshot failed unexpectedly");
    return formatResponse(req, { error: "Failed to retrieve the camera snapshot" }, { status: 500 });
  }
}
