import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server";

serveStdio(createServer, {
  onerror: (error) => console.error("CoreDash MCP error", error),
});

console.error(`CoreDash MCP server running on stdio; target=${process.env.CORE_DASH_URL ?? "http://localhost:3000"}`);
