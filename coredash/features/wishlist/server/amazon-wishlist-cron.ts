import cron, { type ScheduledTask } from "node-cron";

import { AMAZON_WISHLIST, LOCATION } from "@/config/config";
import logger from "@/lib/logger";
import { scrapeAmazonWishlist } from "@/features/wishlist/server/amazon-wishlist-scraper";
import { insertWishlistSnapshots } from "@/features/wishlist/server/amazon-wishlist-snapshot";
import { getWishlistConfiguration } from "@/features/wishlist/server/wishlist-config";

type SchedulerGlobal = typeof globalThis & {
  __coreDashAmazonWishlistTask?: ScheduledTask;
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

export function startAmazonWishlistCron(): ScheduledTask | null {
  const schedulerGlobal = globalThis as SchedulerGlobal;
  if (schedulerGlobal.__coreDashAmazonWishlistTask) {
    return schedulerGlobal.__coreDashAmazonWishlistTask;
  }

  if (!AMAZON_WISHLIST.cronSchedule) {
    logger.warn("Amazon wishlist cron is disabled: CRON_SCHEDULE is required");
    return null;
  }

  if (!cron.validate(AMAZON_WISHLIST.cronSchedule)) {
    logger.error("Amazon wishlist cron is disabled: CRON_SCHEDULE is invalid", {
      schedule: AMAZON_WISHLIST.cronSchedule,
    });
    return null;
  }

  const task = cron.schedule(
    AMAZON_WISHLIST.cronSchedule,
    async () => {
      try {
        await runAmazonWishlistCrawl();
      } catch (error) {
        logger.error("Amazon wishlist crawl failed; no snapshots were written", errorDetails(error));
      }
    },
    { timezone: LOCATION.timezone },
  );

  schedulerGlobal.__coreDashAmazonWishlistTask = task;
  logger.info("Amazon wishlist cron scheduled", {
    schedule: AMAZON_WISHLIST.cronSchedule,
    timezone: LOCATION.timezone,
  });
  return task;
}
