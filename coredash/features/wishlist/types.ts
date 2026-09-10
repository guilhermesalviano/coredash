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
