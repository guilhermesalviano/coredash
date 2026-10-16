import { NextRequest, NextResponse } from "next/server";

import {
  getRuntimeSettings,
  resolveCityFromCoordinates,
  saveRuntimeSettings,
  validateRuntimeSettingsPatch,
} from "@/features/settings/server/runtime-settings";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const latitude = req.nextUrl.searchParams.get("latitude");
    const longitude = req.nextUrl.searchParams.get("longitude");
    if (latitude !== null && longitude !== null) {
      const city = await resolveCityFromCoordinates(latitude, longitude);
      return formatResponse(req, {
        message: "Location resolved successfully",
        data: { city },
      });
    }
    const data = await getRuntimeSettings();
    return formatResponse(req, { message: "Runtime settings retrieved successfully", data });
  } catch (error: unknown) {
    if (error instanceof Error && /must be/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
    return formatResponse(req, { message: "Runtime settings saved successfully", data });
  } catch (error: unknown) {
    if (error instanceof Error && /must be|Unknown setting|payload|configured together/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to save runtime settings", error);
    return NextResponse.json({ error: "Failed to save runtime settings" }, { status: 500 });
  }
}
