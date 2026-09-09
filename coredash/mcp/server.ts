import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const serverVersion = "0.1.0";
const baseUrl = process.env.CORE_DASH_URL ?? "http://localhost:3000";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "CoreDash request failed";
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

async function run<T>(operation: () => Promise<T>) {
  try {
    return textResult(await operation());
  } catch (error: unknown) {
    return errorResult(error);
  }
}

function apiUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

async function callApi<T>(path: string, init?: RequestInit, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(apiUrl(path, query), { ...init, headers });
  const rawBody = await response.text();
  let body: unknown = rawBody;

  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as unknown;
    } catch {
      // Keep non-JSON responses as text so the error remains useful.
    }
  }

  if (!response.ok) {
    const message = isRecord(body) && typeof body.error === "string" ? body.error : response.statusText || "Request failed";
    throw new Error(`CoreDash API ${response.status}: ${message}`);
  }

  return body as T;
}

function jsonBody(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function extractSseText(raw: string): string {
  return raw
    .split("\n\n")
    .map((event) => event.split("\n").find((line) => line.startsWith("data: "))?.slice(6))
    .filter((data): data is string => Boolean(data) && data !== "[DONE]")
    .map((data) => {
      try {
        const parsed: unknown = JSON.parse(data);
        const delta = isRecord(parsed) && isRecord(parsed.delta) ? parsed.delta : null;
        return delta && typeof delta.text === "string" ? delta.text : "";
      } catch {
        return "";
      }
    })
    .join("");
}

function registerReadTools(server: McpServer) {
  server.registerTool("coredash_health", {
    title: "CoreDash health",
    description: "Check whether the local CoreDash application and database are available.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/healthz")));

  server.registerTool("get_weather", {
    title: "Get weather",
    description: "Get the current weather and forecast from CoreDash.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({ limit: z.number().int().positive().max(100).optional() }),
  }, ({ limit }) => run(() => callApi("/api/weather", undefined, { limit })));

  server.registerTool("get_news", {
    title: "Get news",
    description: "Get the configured news feed from CoreDash.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/news")));

  server.registerTool("get_calendar", {
    title: "Get calendar",
    description: "Get today's calendar events and optionally future events.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({ includeFutureEvents: z.boolean().optional() }),
  }, ({ includeFutureEvents }) => run(() => callApi("/api/calendar", undefined, { includeFutureEvents })));

  server.registerTool("get_goals", {
    title: "Get goals",
    description: "Get the goals currently displayed by CoreDash.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/goals")));

  server.registerTool("list_todos", {
    title: "List todos",
    description: "List today's todos, optionally filtering to unchecked items.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({ onlyUnchecked: z.boolean().optional() }),
  }, ({ onlyUnchecked }) => run(() => callApi("/api/todo", undefined, { onlyUnchecked })));

  server.registerTool("get_habits", {
    title: "Get habits",
    description: "Get habit completion history for the dashboard.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/habits")));

  server.registerTool("get_habit_streak", {
    title: "Get habit streak",
    description: "Get the current wake-up habit streak.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/habit")));

  server.registerTool("get_stocks", {
    title: "Get stocks",
    description: "Get the configured stock prices and changes.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/stocks")));

  server.registerTool("get_products", {
    title: "Get products",
    description: "Get products and price alerts from CoreDash.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/products")));

  server.registerTool("get_flights", {
    title: "Get flights",
    description: "Get the latest crawled flight prices.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/flights")));

  server.registerTool("get_wishlist", {
    title: "Get wishlist",
    description: "Get the latest wishlist price alerts.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/wishlist")));

  server.registerTool("get_emails", {
    title: "Get emails",
    description: "Get recent Gmail messages, with optional pagination.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({ pageToken: z.string().optional(), startAt: z.number().int().positive().optional() }),
  }, ({ pageToken, startAt }) => run(() => callApi("/api/emails", undefined, { pageToken, startAt })));

  server.registerTool("get_email", {
    title: "Get email",
    description: "Get the full content of a recent Gmail message by its CoreDash message id.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({ id: z.string().min(1) }),
  }, ({ id }) => run(() => callApi(`/api/emails/${encodeURIComponent(id)}`)));

  server.registerTool("get_spotify_now_playing", {
    title: "Get Spotify playback",
    description: "Get the current Spotify track and available playback devices.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({}),
  }, () => run(() => callApi("/api/spotify")));

  server.registerTool("search_spotify", {
    title: "Search Spotify",
    description: "Search Spotify for tracks, albums, and playlists.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: z.object({ query: z.string().min(1).max(200) }),
  }, ({ query }) => run(() => callApi("/api/spotify/search", undefined, { q: query })));
}

function registerWriteTools(server: McpServer) {
  server.registerTool("create_todo", {
    title: "Create todo",
    description: "Create a todo in CoreDash. The new todo starts unchecked by default.",
    annotations: { destructiveHint: false, idempotentHint: false },
    inputSchema: z.object({
      title: z.string().trim().min(1).max(200),
      checked: z.number().int().min(0).max(1).default(0),
      priority: z.string().trim().max(30).optional(),
      repeat: z.boolean().optional(),
      weeklyInterval: z.number().int().positive().optional(),
      weeklyDays: z.array(z.number().int().min(0).max(6)).optional(),
      weeklyEnd: z.union([z.string(), z.number()]).nullable().optional(),
    }),
  }, (input) => run(() => callApi("/api/todo", jsonBody(input))));

  server.registerTool("update_todo", {
    title: "Update todo",
    description: "Mark a CoreDash todo as checked or unchecked.",
    annotations: { destructiveHint: false, idempotentHint: true },
    inputSchema: z.object({ id: z.number().int().positive(), checked: z.number().int().min(0).max(1) }),
  }, (input) => run(() => callApi("/api/todo", { ...jsonBody(input), method: "PUT" })));

  server.registerTool("record_habit", {
    title: "Record habit",
    description: "Record a completed habit for today. Common habits are wakedup, gym, and study.",
    annotations: { destructiveHint: false, idempotentHint: false },
    inputSchema: z.object({ habit: z.string().trim().min(1).max(100) }),
  }, ({ habit }) => run(() => callApi("/api/habit", jsonBody({ habit }))));

  server.registerTool("mark_email_read", {
    title: "Mark email read",
    description: "Mark a CoreDash Gmail message as read.",
    annotations: { destructiveHint: false, idempotentHint: true },
    inputSchema: z.object({ id: z.string().min(1) }),
  }, ({ id }) => run(() => callApi("/api/emails/mark-read", jsonBody({ id }))));

  server.registerTool("control_spotify", {
    title: "Control Spotify",
    description: "Control playback on Spotify, transfer devices, or play a Spotify URI.",
    annotations: { destructiveHint: false, idempotentHint: false },
    inputSchema: z.discriminatedUnion("action", [
      z.object({ action: z.literal("play") }),
      z.object({ action: z.literal("pause") }),
      z.object({ action: z.literal("next") }),
      z.object({ action: z.literal("prev") }),
      z.object({ action: z.literal("transfer"), deviceId: z.string().min(1) }),
      z.object({ action: z.literal("play_uri"), uri: z.string().min(1), deviceId: z.string().optional() }),
    ]),
  }, (input) => run(() => callApi("/api/spotify/control", jsonBody(input))));

  server.registerTool("ask_coredash_ai", {
    title: "Ask CoreDash AI",
    description: "Ask the configured CoreDash AI assistant. Requests are routed through /api/ai/chat.",
    annotations: { destructiveHint: false, idempotentHint: false },
    inputSchema: z.object({
      prompt: z.string().trim().min(1).max(4000),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) })).max(50).optional(),
    }),
  }, async ({ prompt, history }) => run(async () => {
    const response = await fetch(apiUrl("/api/ai/chat"), {
      ...jsonBody({ messages: [...(history ?? []), { role: "user", content: prompt }] }),
      headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
    });
    const rawBody = await response.text();
    if (!response.ok) {
      let message = response.statusText || "AI request failed";
      try {
        const body: unknown = JSON.parse(rawBody);
        if (isRecord(body) && typeof body.error === "string") message = body.error;
      } catch {
        // Keep the HTTP status message when the API response is not JSON.
      }
      throw new Error(`CoreDash API ${response.status}: ${message}`);
    }
    return { response: extractSseText(rawBody) };
  }));
}

export function createServer() {
  const server = new McpServer({ name: "coredash", version: serverVersion });
  registerReadTools(server);
  registerWriteTools(server);
  return server;
}
