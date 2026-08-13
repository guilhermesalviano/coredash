import { readdirSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const dir = join(process.cwd(), "public", "audios", "feed-dogs");
  const files = readdirSync(dir).filter((file) => /\.mp3$/i.test(file));

  return apiResponse(req, files.map((file) => `/audios/feed-dogs/${file}`));
}