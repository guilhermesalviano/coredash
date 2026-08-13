import { readdirSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const dir = join(process.cwd(), "public", "gifs");
  const files = readdirSync(dir).filter((f) => /\.(gif)$/i.test(f));
  return apiResponse(req, files.map((f) => `/gifs/${f}`));
}
