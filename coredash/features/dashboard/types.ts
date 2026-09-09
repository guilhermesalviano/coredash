import type { NewsItem } from "@/features/news/types";
import type { WeatherData } from "@/features/weather/types";
import type { StockInternalAPIResponse } from "@/types/stock-api";

export type DashboardStatus = "idle" | "loading" | "success" | "error";

export interface DashboardSlice<T> {
  data: T | null;
  status: DashboardStatus;
  lastFetchedAt: number;
}

export interface DashboardStore {
  weather: DashboardSlice<WeatherData>;
  news: DashboardSlice<NewsItem[]>;
  stocks: DashboardSlice<StockInternalAPIResponse[]>;
}

