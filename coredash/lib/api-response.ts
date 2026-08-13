import { NextRequest, NextResponse } from "next/server";
import { stringify } from "smol-toml";

export type ResponseFormat = "json" | "toml";

export function getResponseFormat(req: NextRequest | Request): ResponseFormat {
  return new URL(req.url).searchParams.get("format") === "toml" ? "toml" : "json";
}

export function apiResponse(req: NextRequest | Request, body: unknown, init?: ResponseInit): NextResponse | Response {
  if (getResponseFormat(req) === "toml") {
    return new Response(stringify(body), {
      ...init,
      headers: {
        "Content-Type": "application/toml; charset=utf-8",
        ...init?.headers,
      },
    });
  }

  return NextResponse.json(body, init);
}