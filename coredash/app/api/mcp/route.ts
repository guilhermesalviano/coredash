import { createMcpHandler } from "@modelcontextprotocol/server";
import { createServer } from "@/mcp/server";

export const dynamic = "force-dynamic";

const handler = createMcpHandler(createServer, {
  legacy: "stateless",
  responseMode: "auto",
  onerror: (error) => console.error("CoreDash MCP HTTP error", error),
});

export async function GET(request: Request) {
  return handler.fetch(request);
}

export async function POST(request: Request) {
  return handler.fetch(request);
}

export async function DELETE(request: Request) {
  return handler.fetch(request);
}
