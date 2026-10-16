import { NextRequest, NextResponse } from "next/server";
import { getDatabaseConnection } from "@/lib/db";
import { formatResponse } from "@/lib/api-response";
import { HabitTracker } from "@/entities/HabitTracker";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { Repository } from "typeorm";
import logger from "@/lib/logger";

const habitCache = createMemoryCache<Record<string, string[]>>(ONE_MINUTE_IN_MS * 60 * 3);

export async function GET(req: NextRequest) {
  try {
    const cached = habitCache.get("default");
    if (cached) {
      logger.info("Habits data retrieved from cache successfully");
      return formatResponse(req, { message: "Habits data from cache successfully", data: cached });
    }

    const db = await getDatabaseConnection();
    const repository = db.getRepository(HabitTracker);

    const wakeupStreak = await getHabitStreak("wakedup", repository);
    const gymStreak = await getHabitStreak("gym", repository);
    const studyStreak = await getHabitStreak("study", repository);

    const completions: Record<string, string[]> = {};

    const processHabit = (name: string, dates: Date[] | null) => {
      if (!dates) return;
      
      dates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0];
        
        if (!completions[dateKey]) {
          completions[dateKey] = [];
        }

        if (!completions[dateKey].includes(name)) {
          completions[dateKey].push(name);
        }
      });
    };

    processHabit("wakedup", wakeupStreak.dates);
    processHabit("gym", gymStreak.dates);
    processHabit("study", studyStreak.dates);

    habitCache.set("default", completions);

    return formatResponse(req, { 
      message: "Habits retrieved successfully", 
      data: completions
    });

  } catch (error) {
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { habit, createdAt } = body;

    const habitToSave = {
      habit,
      createdAt
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

async function getHabitStreak(habitName: string, repository: Repository<HabitTracker>): Promise<{ streak: number; dates: Date[] | null, lastDay: Date | null }> {
  const history = await repository.find({
    where: { habit: habitName },
    order: { createdAt: "DESC" },
  });

  if (history.length === 0) return { streak: 0, dates: null, lastDay: null };

  const firstDateInDb = history[0].createdAt;

  let streak = 0;
  let lastDate = new Date(firstDateInDb);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // const diffInMs = today.getTime() - lastDate.getTime();
  // const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  // if (diffInDays > 1) return { streak: 0, dates: null, lastDay: null };

  const dates = history
    .filter((record) => {
      const recordDate = new Date(record.createdAt);
      return today.getMonth() === recordDate.getMonth() && 
            today.getFullYear() === recordDate.getFullYear();
    })
  .map((record) => new Date(record.createdAt));

  for (const record of history) {
    const currentDate = new Date(record.createdAt);

    const diff = lastDate.getTime() - currentDate.getTime();
    const daysBetween = diff / (1000 * 60 * 60 * 24);

    if (daysBetween <= 1) {
      if (daysBetween === 1) {
        streak++;
      } else if (streak === 0) {
        streak = 1;
      }
      lastDate = currentDate;
    } else {
      break;
    }
  }

  return {
    streak,
    dates: dates.length > 0 ? dates : null,
    lastDay: firstDateInDb
  };
}