export interface WishlistScrapedItem {
  title: string;
  price: string;
  link: string;
}

export interface WishlistSnapshotResult {
  attempted: number;
  inserted: number;
  failed: number;
}

export interface WishlistPriceDrop {
  name: string;
  currentPrice: string;
  previousPrice: string;
  savings: number;
  percentage: number;
  link: string;
  store: "Amazon";
}
