export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startAmazonWishlistCron } = await import("@/features/wishlist/server/amazon-wishlist-cron");
  startAmazonWishlistCron();
}
