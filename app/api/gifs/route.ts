import { NextRequest } from "next/server";
import { getLoadingGifs } from "@/features/dashboard/server/loading-gifs";
import { formatResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return formatResponse(req, await getLoadingGifs());
}
