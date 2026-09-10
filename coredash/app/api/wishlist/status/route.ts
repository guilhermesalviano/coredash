import { NextRequest, NextResponse } from "next/server";

import { getWishlistUpdateStatus } from "@/features/wishlist/server/get-wishlist-update-status";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await getWishlistUpdateStatus();
    return formatResponse(req, { message: "Wishlist update status retrieved successfully", data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Failed to retrieve wishlist update status", error);
    return NextResponse.json({ error: "Failed to retrieve wishlist update status" }, { status: 500 });
  }
}
