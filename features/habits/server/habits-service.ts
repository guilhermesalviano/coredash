import { Between, In } from "typeorm";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { HabitTracker } from "@/entities/HabitTracker";
import { getDatabaseConnection } from "@/lib/db";
import { globalSingleton } from "@/lib/global-singleton";
import { createMemoryCache } from "@/utils/in-memory-cache";

export type HabitCompletions = Record<string, string[]>;

// Order decides how habits are listed inside a day.
const TRACKED_HABITS = ["wakedup", "gym", "study"];
const ONE_DAY_IN_MS = 24 * 60 * ONE_MINUTE_IN_MS;

const habitCache = globalSingleton("habitCompletionsCache", () =>
  createMemoryCache<HabitCompletions>(ONE_MINUTE_IN_MS * 60 * 3));

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/** Completed habits of the current month, keyed by `yyyy-MM-dd`. */
export async function getMonthCompletions(): Promise<{ data: HabitCompletions; fromCache: boolean }> {
  const today = new Date();
  // Keyed by month so a cached answer is not reused after the month turns.
  const cacheKey = monthKey(today);
  const cached = habitCache.get(cacheKey);
  if (cached) return { data: cached, fromCache: true };

  const db = await getDatabaseConnection();
  // One query for the month instead of the full history of every habit. The
  // range is a day wider on both sides because rows are stored in UTC; the
  // exact month check below runs in local time, as it always has.
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const records = await db.getRepository(HabitTracker).find({
    select: { habit: true, createdAt: true },
    where: {
      habit: In(TRACKED_HABITS),
      createdAt: Between(
        new Date(monthStart.getTime() - ONE_DAY_IN_MS),
        new Date(nextMonthStart.getTime() + ONE_DAY_IN_MS),
      ),
    },
    order: { createdAt: "DESC" },
  });

  const completions: HabitCompletions = {};
  for (const habit of TRACKED_HABITS) {
    for (const record of records) {
      if (record.habit !== habit) continue;
      const date = new Date(record.createdAt);
      if (date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear()) continue;

      const dateKey = date.toISOString().split("T")[0];
      const names = (completions[dateKey] ??= []);
      if (!names.includes(habit)) names.push(habit);
    }
  }

  habitCache.set(cacheKey, completions);
  return { data: completions, fromCache: false };
}

export async function saveHabit(habit: string, createdAt: Date): Promise<HabitTracker> {
  const db = await getDatabaseConnection();
  const saved = await db.getRepository(HabitTracker).save({ habit, createdAt });
  habitCache.clear();
  return saved;
}
