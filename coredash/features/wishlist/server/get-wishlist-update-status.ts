import type { WishlistUpdateStatus } from "@/features/wishlist/types";

function calendarDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// "Today" is evaluated in the same timezone the crawl cron is scheduled in.
export function buildWishlistUpdateStatus(
  lastUpdatedAt: Date | null,
  timezone: string,
  now = new Date(),
): WishlistUpdateStatus {
  return {
    lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
    updatedToday: lastUpdatedAt !== null && calendarDay(lastUpdatedAt, timezone) === calendarDay(now, timezone),
    timezone,
  };
}

export async function getWishlistUpdateStatus(): Promise<WishlistUpdateStatus> {
  const { WishlistAmazon } = await import("@/entities/WishlistAmazon");
  const { getDatabaseConnection } = await import("@/lib/db");
  const { getRuntimeSettings } = await import("@/features/settings/server/runtime-settings");
  const database = await getDatabaseConnection();
  const [latest] = await database.getRepository(WishlistAmazon).find({
    select: ["id", "searchDate"],
    order: { searchDate: "DESC", id: "DESC" },
    take: 1,
  });
  const { settings } = await getRuntimeSettings();

  return buildWishlistUpdateStatus(latest?.searchDate ?? null, settings.timezone);
}
