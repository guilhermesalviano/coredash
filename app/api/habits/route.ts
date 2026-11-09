import { NextRequest, NextResponse } from "next/server";
import { getMonthCompletions, saveHabit } from "@/features/habits/server/habits-service";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { data, fromCache } = await getMonthCompletions();
    if (fromCache) {
      logger.info("Habits data retrieved from cache successfully");
      return formatResponse(req, { message: "Habits data from cache successfully", data });
    }

    return formatResponse(req, { message: "Habits retrieved successfully", data });
  } catch (error: unknown) {
    logger.error("Failed to retrieve habits", error);
    return formatResponse(req, { error: "Failed to retrieve habits data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { habit, createdAt } = body;

    const habitTrackerSaved = await saveHabit(habit, createdAt);

    return NextResponse.json({ message: "Habit saved successfully", data: habitTrackerSaved });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save habit data" }, { status: 500 });
  }
}
