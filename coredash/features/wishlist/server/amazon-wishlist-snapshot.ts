import "reflect-metadata";

import type { InsertResult } from "typeorm";

import type { WishlistAmazon } from "@/entities/WishlistAmazon";
import logger from "@/lib/logger";
import type { WishlistScrapedItem, WishlistSnapshotResult } from "@/features/wishlist/types";

function errorDetails(error: unknown): { error: string; stack?: string } {
  if (error instanceof Error) return { error: error.message, stack: error.stack };
  return { error: String(error) };
}

export interface WishlistSnapshotRepository {
  insert(values: Pick<WishlistAmazon, "title" | "price" | "link" | "searchDate">): Promise<InsertResult>;
}

export async function writeWishlistSnapshots(
  items: WishlistScrapedItem[],
  searchDate = new Date(),
  repository: WishlistSnapshotRepository,
): Promise<WishlistSnapshotResult> {
  let inserted = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await repository.insert({
        title: item.title,
        price: item.price,
        link: item.link,
        searchDate,
      });
      inserted += 1;
    } catch (error) {
      failed += 1;
      logger.error("Amazon wishlist item snapshot insert failed", {
        ...errorDetails(error),
        title: item.title,
      });
    }
  }

  return { attempted: items.length, inserted, failed };
}

export async function insertWishlistSnapshots(
  items: WishlistScrapedItem[],
  searchDate = new Date(),
): Promise<WishlistSnapshotResult> {
  const { WishlistAmazon } = await import("@/entities/WishlistAmazon");
  const { getDatabaseConnection } = await import("@/lib/db");
  const database = await getDatabaseConnection();
  return writeWishlistSnapshots(items, searchDate, database.getRepository(WishlistAmazon));
}
