import cron, { type ScheduledTask } from "node-cron";

import logger from "@/lib/logger";
import { getRuntimeSettings } from "@/features/settings/server/runtime-settings";
import type { RuntimeSettings } from "@/features/settings/types";
import { scrapeAmazonWishlist } from "@/features/wishlist/server/amazon-wishlist-scraper";
import { insertWishlistSnapshots } from "@/features/wishlist/server/amazon-wishlist-snapshot";
import { getWishlistConfiguration } from "@/features/wishlist/server/wishlist-config";

type SchedulerGlobal = typeof globalThis & {
  __coreDashAmazonWishlistTask?: ScheduledTask;
  __coreDashAmazonWishlistScheduleKey?: string;
  __coreDashAmazonWishlistRunning?: boolean;
};

function errorDetails(error: unknown): { error: string; stack?: string } {
  if (error instanceof Error) return { error: error.message, stack: error.stack };
  return { error: String(error) };
}

export async function runAmazonWishlistCrawl(): Promise<void> {
  const { wishlistId } = await getWishlistConfiguration();
  if (!wishlistId) {
    logger.warn("Amazon wishlist crawl skipped: no wishlist is configured");
    return;
  }

  const items = await scrapeAmazonWishlist(wishlistId);
  const result = await insertWishlistSnapshots(items);
  logger.info("Amazon wishlist snapshot completed", {
    wishlistId,
    ...result,
  });
}

function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function refreshAmazonWishlistCron(settings?: RuntimeSettings): Promise<ScheduledTask | null> {
  const schedulerGlobal = globalThis as SchedulerGlobal;
  const effectiveSettings = settings ?? (await getRuntimeSettings()).settings;
  const { cronSchedule, timezone } = effectiveSettings;

  if (!cronSchedule) {
    schedulerGlobal.__coreDashAmazonWishlistTask?.stop();
    delete schedulerGlobal.__coreDashAmazonWishlistTask;
    delete schedulerGlobal.__coreDashAmazonWishlistScheduleKey;
    logger.warn("Amazon wishlist cron is disabled: no schedule is configured");
    return null;
  }

  if (!cron.validate(cronSchedule) || cronSchedule.split(/\s+/).length !== 5 || !validTimezone(timezone)) {
    logger.error("Amazon wishlist cron was not updated: schedule or timezone is invalid", {
      schedule: cronSchedule,
      timezone,
    });
    return schedulerGlobal.__coreDashAmazonWishlistTask ?? null;
  }

  const scheduleKey = `${cronSchedule}|${timezone}`;
  if (schedulerGlobal.__coreDashAmazonWishlistScheduleKey === scheduleKey) {
    return schedulerGlobal.__coreDashAmazonWishlistTask ?? null;
  }

  const task = cron.schedule(
    cronSchedule,
    async () => {
      if (schedulerGlobal.__coreDashAmazonWishlistRunning) {
        logger.warn("Amazon wishlist crawl skipped because a previous crawl is still running");
        return;
      }
      schedulerGlobal.__coreDashAmazonWishlistRunning = true;
      try {
        await runAmazonWishlistCrawl();
      } catch (error) {
        logger.error("Amazon wishlist crawl failed; no snapshots were written", errorDetails(error));
      } finally {
        schedulerGlobal.__coreDashAmazonWishlistRunning = false;
      }
    },
    { timezone },
  );

  schedulerGlobal.__coreDashAmazonWishlistTask?.stop();
  schedulerGlobal.__coreDashAmazonWishlistTask = task;
  schedulerGlobal.__coreDashAmazonWishlistScheduleKey = scheduleKey;
  logger.info("Amazon wishlist cron scheduled", {
    schedule: cronSchedule,
    timezone,
  });
  return task;
}

export function startAmazonWishlistCron(): void {
  void refreshAmazonWishlistCron().catch((error) => {
    logger.error("Amazon wishlist cron could not be initialized", errorDetails(error));
  });
}
