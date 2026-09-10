import type { WishlistConfiguration, WishlistPriceDrop } from "@/features/wishlist/types";

export interface WishlistInternalAPIResponse {
  name: string;
  price: string;
  link: string;
  store: string;
  alert: boolean;
}

export type WishlistPriceDropAPIResponse = WishlistPriceDrop;
export type WishlistConfigurationAPIResponse = WishlistConfiguration;
