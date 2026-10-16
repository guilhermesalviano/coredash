import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { CONFIG } from "@/config/config";

export function GET(req: NextRequest) {
  if (!CONFIG.isDev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mem = process.memoryUsage();
  return formatResponse(req, {
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
  });
}
