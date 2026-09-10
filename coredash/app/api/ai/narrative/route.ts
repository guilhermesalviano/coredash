import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/config/config";
import getUserCity from "@/utils/get-user-city";
import { format } from "date-fns";
import logger from "@/lib/logger";
import OllamaProvider from "@/lib/ai/providers/ollama";
import { ROCKY_INSTRUCTION } from "@/lib/ai/assistants/rocky/instruction";

export const maxDuration = 300; 

export async function POST(req: NextRequest) {
    try {
        const today = format(new Date(), "yyyy-MM-dd");
        const internalBase = `http://127.0.0.1:${process.env.PORT || 3000}`;
        const fetchInternal = async (path: string) => {
            try {
                const r = await fetch(new URL(path, internalBase), { signal: AbortSignal.timeout(5000) });
                if (r.ok) return await r.json();
            } catch {}
            return { data: [] };
        };

        const [todo, calendar, habits] = await Promise.all([
            fetchInternal("/api/todo"),
            fetchInternal("/api/calendar"),
            fetchInternal("/api/habits"),
        ]);

        const todoItems = Array.isArray(todo?.data) ? todo.data : [];
        const todoSummary = todoItems.filter((t: any) => t.checked === 0).map((t: any) => {
            return t.title + (t.sponsor ? `, resp: ${t.sponsor}` : "") +
                (t.usualCompletionTime ? `, usual time: ${t.usualCompletionTime.replace(":", "h")}` : "")
        }).join(", ");

        const calendarEvents = Array.isArray(calendar?.data?.todayEvents) ? calendar.data.todayEvents : [];
        const calendarSummary = calendarEvents.map((c: any) => c.title + " at " + c.start).join(", ");

        const body = await req.text();
        if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

        const { weather, hour } = JSON.parse(body);

        const forecastSummary = weather.forecast
            .map((h: any) => `${h.time}:${h.condition},${h.temp}°C`).join("|");
        const willBeRain = weather.forecast
            .map((h: any) => /chuva|tempestade|rain|drizzle|shower|storm|trovoada/i.test(h.condition))
            .some((r: boolean) => r);
        const userLocation = await getUserCity();
        const todoCount = todoItems.filter((t: any) => t.checked === 0).length;
        const isMorning = hour >= 6 && hour <= 12;

        const HABITSINSTRUCTION = "instructions: waking up early, studying, exercising.";

        const habitsData = habits?.data && typeof habits.data === "object" ? habits.data : {};
        const entries = Object.entries(habitsData) as [string, any][];
        const habitsSummary = HABITSINSTRUCTION + " " + (entries.length > 0 
            ? entries[0][0] === today 
                ? `Completed habits for ${today}: ${entries[0][1].join(", ")}` 
                : `No habits have been completed ${isMorning ? "yet" : "today"}.`
            : "No habit history found.");

        const prompt = [
            CONFIG.isDev && "[MOCK]",
            "don't list all the information you recieved in this prompt, but use it to create a personalized narrative for the user.",
            `[${today}|${userLocation.city},${userLocation.state}|weather:${weather.temp}°C,${weather.condition}]`,
            `forecast[↑specific|${willBeRain ? "rain" : "no rain"}]:${forecastSummary}`,
            `calendar:${calendarSummary || "∅"}`,
            `reminders(${todoCount}⏰):${todoSummary || "∅"}`,
            `habits:${habitsSummary}`,
        ].filter(Boolean).join(";");

        const { stream, error } = await OllamaProvider({
            prompt,
            systemInstruction: ROCKY_INSTRUCTION,
        });
        if (error || !stream) {
            logger.error(error);
            return NextResponse.json({ error }, { status: 500 });
        }

        const readable = new ReadableStream({
            async start(controller) {
                logger.info("Narrative stream initialized.");
                try {
                    for await (const chunk of stream) {
                        const text = chunk.message?.content ?? "";
                        if (text) controller.enqueue(new TextEncoder().encode(JSON.stringify({ response: text }) + "\n"));
                    }
                    controller.close();
                } catch (err: any) {
                    logger.error(`[stream error] ${err.message}`); // ← add this
                    controller.error(err);
                }

            },
        });

        return new Response(readable, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (err: any) {
        if (err.code === "ECONNRESET" || err.message === "aborted") {
            logger.debug("[narrative] client disconnected early");
            return NextResponse.json({ error: "Client disconnected" }, { status: 500 });
        }
        logger.error("AI Narrative API error", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
