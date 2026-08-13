import { NextRequest, NextResponse } from "next/server";
import { getDatabaseConnection } from "@/lib/db";
import { format } from "date-fns";
import { HabitTracker } from "@/entities/HabitTracker";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { StreakResponse } from "@/types/habit";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { apiResponse } from "@/lib/api-response";

const habitCache = createMemoryCache<StreakResponse>(ONE_MINUTE_IN_MS * 60 * 3);

export async function GET(req: NextRequest) {
  const cached = habitCache.get("default");
  if (cached) {
    return apiResponse(req, { message: "Habit data from cache successfully", data: cached });
  }

  try {
    const db = await getDatabaseConnection();
    const repository = db.getRepository(HabitTracker);

    const all = await repository.find({
      select: { createdAt: true },
      where: { habit: "wakedup" },
      order: { createdAt: "DESC" },
    });

    const records = [
      ...new Map(
        all.map((r) => {
          const date = format(r.createdAt, "yyyy-MM-dd");
          return [date, { date }];
        })
      ).values(),
    ];

    if (records.length === 0) {
      return apiResponse(req, { message: "Habit retrieve successfully", data: { streak: 0 } });
    };

    let streak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expectedDate = new Date(today);
    let lastDayOfWeek = new Date(today);

    for (let i = 0; i < records.length; i++) {
      const recordDate = new Date(records[i].date);
      
      if (i === 0) {
        const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 1) {
          return apiResponse(req, { message: "Habit retrieve successfully", data: { streak: 0 } }, { status: 200 })
        };
        
        lastDayOfWeek = new Date(recordDate);
        expectedDate = new Date(recordDate);
        streak++;
        continue;
      }

      expectedDate.setDate(expectedDate.getDate() - 1);

      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    const streakMap = {
      streak,
      lastDayOfWeek
    }

    habitCache.set("default", streakMap);

    return apiResponse(req, { message: "Habit retrieve successfully", data: streakMap });
  } catch (error: unknown) {
    console.error(error)
    return apiResponse(req, { error: "Failed to retrieve todos data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { habit } = body;

    const habitToSave = {
      habit,
      createdAt: format(new Date(), "yyyy-MM-dd")
    }

    const db = await getDatabaseConnection();

    const habitTrackerRepository = db.getRepository(HabitTracker);
    const habitTrackerSaved = await habitTrackerRepository.save(habitToSave);

    habitCache.clear();

    return NextResponse.json({ message: "Habit saved successfully", data: habitTrackerSaved });
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Failed to save todos data" }, { status: 500 });
  }
}
