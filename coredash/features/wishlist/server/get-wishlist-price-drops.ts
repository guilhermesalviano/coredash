import type { WishlistPriceDrop } from "@/features/wishlist/types";

export interface WishlistPriceSnapshot {
  id: number;
  title: string;
  price: string;
  link: string;
  searchDate: Date;
}

export function parseWishlistPrice(value: string): number | null {
  const cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) return null;

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/,/g, "").replace(/\.(?=\d{3}(?:$|\.))/g, "");
  const price = Number.parseFloat(normalized);
  return Number.isFinite(price) ? price : null;
}

export function findWishlistPriceDrops(
  snapshots: WishlistPriceSnapshot[],
  limit = 5,
): WishlistPriceDrop[] {
  const byTitle = new Map<string, WishlistPriceSnapshot[]>();

  for (const snapshot of snapshots) {
    const current = byTitle.get(snapshot.title) ?? [];
    current.push(snapshot);
    byTitle.set(snapshot.title, current);
  }

  const drops: WishlistPriceDrop[] = [];
  for (const productSnapshots of byTitle.values()) {
    const priced = productSnapshots
      .filter((snapshot) => parseWishlistPrice(snapshot.price) !== null)
      .sort((a, b) => {
        const dateDifference = new Date(b.searchDate).getTime() - new Date(a.searchDate).getTime();
        return dateDifference || b.id - a.id;
      });

    if (priced.length < 2) continue;

    const current = priced[0];
    const previous = priced[1];
    const currentValue = parseWishlistPrice(current.price)!;
    const previousValue = parseWishlistPrice(previous.price)!;
    const savings = previousValue - currentValue;

    if (savings <= 0) continue;

    drops.push({
      name: current.title,
      currentPrice: current.price,
      previousPrice: previous.price,
      savings,
      percentage: (savings / previousValue) * 100,
      link: current.link,
      store: "Amazon",
    });
  }

  return drops
    .sort((a, b) => b.savings - a.savings || b.percentage - a.percentage)
    .slice(0, limit);
}

export async function getWishlistPriceDrops(limit = 5): Promise<WishlistPriceDrop[]> {
  const { WishlistAmazon } = await import("@/entities/WishlistAmazon");
  const { getDatabaseConnection } = await import("@/lib/db");
  const database = await getDatabaseConnection();
  const snapshots = await database.getRepository(WishlistAmazon).find({
    select: ["id", "title", "price", "link", "searchDate"],
    order: { searchDate: "DESC", id: "DESC" },
  });

  return findWishlistPriceDrops(snapshots, limit);
}
