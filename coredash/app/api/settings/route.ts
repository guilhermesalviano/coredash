import { NextRequest, NextResponse } from "next/server";

import {
  getRuntimeSettings,
  saveRuntimeSettings,
  validateRuntimeSettingsPatch,
} from "@/features/settings/server/runtime-settings";
import { refreshAmazonWishlistCron } from "@/features/wishlist/server/amazon-wishlist-cron";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await getRuntimeSettings();
    return formatResponse(req, { message: "Runtime settings retrieved successfully", data });
  } catch (error: unknown) {
    console.error("Failed to retrieve runtime settings", error);
    return NextResponse.json({ error: "Failed to retrieve runtime settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Settings payload must be valid JSON" }, { status: 400 });
    }
    const patch = validateRuntimeSettingsPatch(body);
    const data = await saveRuntimeSettings(patch);
    await refreshAmazonWishlistCron(data.settings);
    return formatResponse(req, { message: "Runtime settings saved successfully", data });
  } catch (error: unknown) {
    if (error instanceof Error && /must be|Unknown setting|payload/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to save runtime settings", error);
    return NextResponse.json({ error: "Failed to save runtime settings" }, { status: 500 });
  }
}
