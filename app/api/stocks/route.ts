import { getStocks } from "@/features/stocks/server/get-stocks";
import { AppError } from "@/lib/api-error";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { data, source, fromCache } = await getStocks();
    if (fromCache) {
      logger.info("Stocks data retrieved from cache successfully");
      return formatResponse(req, { message: "Stocks data from cache successfully", data });
    }

    return formatResponse(req, {
      message: "Stocks data retrieved successfully",
      source,
      data,
    }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError && error.status === 404) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to retrieve stocks data" },
      { status: 500 }
    );
  }
}
