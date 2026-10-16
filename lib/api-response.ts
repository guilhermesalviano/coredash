import { encode } from "@toon-format/toon";
import { NextRequest, NextResponse } from "next/server";

const TOON_FORMAT = "toon";

function searchParamsFromRequest(req: Request | NextRequest | undefined): URLSearchParams | null {
  if (!req) return null;
  if (req instanceof NextRequest) return req.nextUrl.searchParams;
  return new URL(req.url).searchParams;
}

export function getFormatParam(req: Request | NextRequest | undefined): string | null {
  const searchParams = searchParamsFromRequest(req);
  if (!searchParams) return null;
  const format = searchParams.get("format");
  return format?.toLowerCase() === TOON_FORMAT ? TOON_FORMAT : null;
}

export function formatResponse(
  req: Request | NextRequest | undefined,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  if (getFormatParam(req) === TOON_FORMAT) {
    return new NextResponse(encode(body) + "\n", {
      ...init,
      headers: {
        "Content-Type": "text/toon; charset=utf-8",
        ...init?.headers,
      },
    });
  }

  return NextResponse.json(body, init);
}