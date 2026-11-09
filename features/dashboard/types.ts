import type { NewsItem } from "@/features/news/types";
import type { WeatherData } from "@/features/weather/types";
import type { StockInternalAPIResponse } from "@/types/stock-api";

export type DashboardStatus = "idle" | "loading" | "success" | "error";

export interface DashboardSlice<T> {
  data: T | null;
  status: DashboardStatus;
  lastFetchedAt: number;
  error: string | null;
}

export interface DashboardStore {
  weather: DashboardSlice<WeatherData>;
  news: DashboardSlice<NewsItem[]>;
  stocks: DashboardSlice<StockInternalAPIResponse[]>;
}


/** Server-cached slice handed to the client so the first paint has data. */
export interface DashboardSeedEntry<T> {
  data: T;
  fetchedAt: number;
  /** False when the server already considers the value due for a refresh. */
  fresh: boolean;
}

export type DashboardSeed = {
  [K in keyof DashboardStore]?: DashboardSeedEntry<NonNullable<DashboardStore[K]["data"]>>;
};
