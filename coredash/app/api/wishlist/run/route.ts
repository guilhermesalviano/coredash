import { NextRequest, NextResponse } from "next/server";

import { runGuardedAmazonWishlistCrawl } from "@/features/wishlist/server/amazon-wishlist-cron";
import { formatResponse } from "@/lib/api-response";

const MESSAGES = {
  completed: "Wishlist crawl completed successfully",
  skipped: "Wishlist crawl skipped because a previous crawl is still running",
  failed: "Wishlist crawl failed; no snapshots were written",
} as const;

export async function POST(req: NextRequest) {
  try {
    const data = await runGuardedAmazonWishlistCrawl();
    const status = data.status === "failed" ? 500 : data.status === "skipped" ? 409 : 200;
    return formatResponse(req, { message: MESSAGES[data.status], data }, { status });
  } catch (error: unknown) {
    console.error("Failed to run wishlist crawl", error);
    return NextResponse.json({ error: "Failed to run wishlist crawl" }, { status: 500 });
  }
}
