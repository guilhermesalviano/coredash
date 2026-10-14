import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterProviderProps {
  prompt: string;
  systemInstruction?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export function openRouterMessages({
  prompt,
  systemInstruction,
  history = [],
}: OpenRouterProviderProps): OpenRouterMessage[] {
  return [
    ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
    ...history.map((message) => ({ role: message.role, content: message.content })),
    { role: "user" as const, content: prompt },
  ];
}

export function parseOpenRouterSseLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const data = trimmed.slice(5).trim();
  if (!data || data === "[DONE]") return null;
  try {
    const payload = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.delta?.content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}

export function collectOpenRouterDeltas(payload: string): string[] {
  const deltas: string[] = [];
  for (const line of payload.split(/\r?\n/)) {
    const delta = parseOpenRouterSseLine(line);
    if (delta) deltas.push(delta);
  }
  return deltas;
}

async function* iterateSse(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const delta = parseOpenRouterSseLine(line);
        if (delta) yield delta;
      }
    }
    buffer += decoder.decode();
    const tail = parseOpenRouterSseLine(buffer);
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

function providerError(payload: string, status: number): string {
  try {
    const body = JSON.parse(payload) as { error?: { message?: string } | string };
    if (typeof body.error === "string" && body.error) return body.error;
    if (body.error && typeof body.error === "object" && body.error.message) return body.error.message;
  } catch {
    // Fall through to the status line.
  }
  return `OpenRouter request failed with status ${status}`;
}

export default async function OpenRouterProvider({
  prompt,
  systemInstruction,
  history = [],
}: OpenRouterProviderProps): Promise<{ stream: AsyncIterable<string> | null; error?: string }> {
  const settings = await getResolvedRuntimeSettings();
  if (!settings.openRouterApiKey) {
    return { stream: null, error: "OpenRouter API key is not configured" };
  }
  if (!settings.aiModel) {
    return { stream: null, error: "OpenRouter model is not configured" };
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.CORE_DASH_URL ?? "http://localhost:3000",
        "X-Title": "CoreDash",
      },
      body: JSON.stringify({
        model: settings.aiModel,
        stream: true,
        messages: openRouterMessages({ prompt, systemInstruction, history }),
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok || !response.body) {
      const payload = await response.text().catch(() => "");
      return { stream: null, error: providerError(payload, response.status) };
    }

    return { stream: iterateSse(response.body) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return { stream: null, error: "OpenRouter request timed out" };
    }
    return { stream: null, error: `OpenRouter request failed: ${message}` };
  }
}
