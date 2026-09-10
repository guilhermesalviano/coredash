import { NextRequest, NextResponse } from "next/server";

import {
  extractWishlistId,
  getWishlistConfiguration,
  saveWishlistConfiguration,
} from "@/features/wishlist/server/wishlist-config";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await getWishlistConfiguration();
    return formatResponse(req, { message: "Wishlist configuration retrieved successfully", data });
  } catch (error: unknown) {
    console.error("Failed to retrieve wishlist configuration", error);
    return NextResponse.json({ error: "Failed to retrieve wishlist configuration" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { value?: unknown };
    if (typeof body.value !== "string") {
      return NextResponse.json({ error: "Wishlist ID or Amazon Brazil wishlist URL is required" }, { status: 400 });
    }

    const value = body.value.trim();
    const wishlistId = value ? extractWishlistId(value) : null;
    if (value && !wishlistId) {
      return NextResponse.json({ error: "Provide a valid Amazon Brazil wishlist URL or wishlist ID" }, { status: 400 });
    }

    const data = await saveWishlistConfiguration(wishlistId);
    return formatResponse(req, { message: "Wishlist configuration saved successfully", data });
  } catch (error: unknown) {
    console.error("Failed to save wishlist configuration", error);
    return NextResponse.json({ error: "Failed to save wishlist configuration" }, { status: 500 });
  }
}
