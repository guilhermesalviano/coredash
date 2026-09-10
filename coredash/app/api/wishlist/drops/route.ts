import { NextRequest, NextResponse } from "next/server";

import { getWishlistPriceDrops } from "@/features/wishlist/server/get-wishlist-price-drops";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await getWishlistPriceDrops();
    return formatResponse(req, { message: "Wishlist price drops retrieved successfully", data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Failed to retrieve wishlist price drops", error);
    return NextResponse.json({ error: "Failed to retrieve wishlist price drops" }, { status: 500 });
  }
}
