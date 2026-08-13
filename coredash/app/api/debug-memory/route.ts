import { NextRequest } from "next/server";
import { formatResponse } from "@/lib/api-response";

export function GET(req: NextRequest) {
  const mem = process.memoryUsage();
  return formatResponse(req, {
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
  });
}