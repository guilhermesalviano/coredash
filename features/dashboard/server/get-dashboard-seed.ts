import type { DashboardSeed } from "@/features/dashboard/types";
import { peekNews } from "@/features/news/server/get-news";
import { peekStocks } from "@/features/stocks/server/get-stocks";
import { peekWeatherData } from "@/features/weather/server/get-weather";

/**
 * Collects whatever the server already has cached. It never calls a provider,
 * so rendering the page is not blocked by a slow or failing upstream.
 */
export async function getDashboardSeed(): Promise<DashboardSeed> {
  const seed: DashboardSeed = {};

  const weather = await peekWeatherData().catch(() => null);
  if (weather) seed.weather = weather;

  const stocks = peekStocks();
  if (stocks) seed.stocks = stocks;

  // The client store starts in pt-BR and refetches when the saved locale differs.
  const news = peekNews("pt-BR");
  if (news) seed.news = news;

  return seed;
}
