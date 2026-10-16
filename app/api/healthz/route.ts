import { NextResponse } from "next/server";
import { getDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = await getDatabaseConnection();
    await database.query("SELECT 1");
    return NextResponse.json({
      status: "ok",
      database: "ok",
      uptime: Math.round(process.uptime()),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "error" },
      { status: 503 },
    );
  }
}
