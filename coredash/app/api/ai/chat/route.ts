import { NextRequest, NextResponse } from "next/server";
import OllamaProvider from "@/lib/ai/providers/ollama";
import type { ChatRequest } from "@/features/ai/types";

const SYSTEM_PROMPT = "You are Rocky, a smart and concise personal assistant embedded in a personal dashboard. Be helpful, direct, and warm. Keep answers brief unless detail is needed. You can help with tasks, planning, questions, and anything the user needs.";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    if (!Array.isArray(body.messages) || body.messages.some((message) => !message?.content || !["user", "assistant"].includes(message.role))) {
      return NextResponse.json({ error: "Invalid chat messages" }, { status: 400 });
    }

    const lastMessage = body.messages.at(-1);
    if (!lastMessage) return NextResponse.json({ error: "At least one message is required" }, { status: 400 });

    const { stream, error } = await OllamaProvider({
      prompt: lastMessage.content,
      systemInstruction: SYSTEM_PROMPT,
      history: body.messages.slice(0, -1),
    });
    if (error || !stream) return NextResponse.json({ error: error ?? "AI provider unavailable" }, { status: 503 });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.message?.content ?? "";
            if (text) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } })}\n\n`));
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" } });
  } catch {
    return NextResponse.json({ error: "Invalid AI request" }, { status: 400 });
  }
}

