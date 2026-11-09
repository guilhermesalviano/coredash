import { ONE_MINUTE_IN_MS } from "@/constants";
import { STOCKS } from "@/constants/stocks";
import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { AppError } from "@/lib/api-error";
import { fetchBrapiAPI } from "@/services/brapi-api";
import { fetchYahooPrice } from "@/services/yahoo-finance";
import type { StockInternalAPIResponse } from "@/types/stock-api";
import { isErrorResponse } from "@/utils/check-service-error";
import { createSwrCache, type SwrCacheEntry } from "@/utils/in-memory-cache";
import { globalSingleton } from "@/lib/global-singleton";

interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

export type StocksSource = "brapi" | "yahoo";

export interface StocksSnapshot {
  data: StockInternalAPIResponse[];
  source: StocksSource;
}

const CACHE_KEY = "default";

const stocksCache = globalSingleton("stocksCache", () => createSwrCache<StocksSnapshot>({
  ttlMs: ONE_MINUTE_IN_MS * 10,
  staleMs: ONE_MINUTE_IN_MS * 20,
}));

function mapStocks(results: StockQuote[]): StockInternalAPIResponse[] {
  return results.map((stock) => ({
    ticker: stock.symbol,
    price: stock.regularMarketPrice,
    priceOpened: stock.regularMarketDayHigh,
    change: stock.regularMarketChange,
    pct: stock.regularMarketChangePercent,
  }));
}

async function loadStocks(): Promise<StocksSnapshot> {
  const symbols = Object.values(STOCKS).flat();

  const settings = await getResolvedRuntimeSettings();
  const brapiData = await fetchBrapiAPI(symbols.join(","), settings.brapiToken);
  if (!isErrorResponse(brapiData) && brapiData.results?.length) {
    return { data: mapStocks(brapiData.results), source: "brapi" };
  }

  const yahooData = await fetchYahooPrice(symbols.map((symbol) => `${symbol}.SA`));
  if (yahooData?.results?.length) {
    return { data: mapStocks(yahooData.results as StockQuote[]), source: "yahoo" };
  }

  throw new AppError("Nenhuma ação encontrada no momento", 404);
}

export async function getStocks(): Promise<StocksSnapshot & { fromCache: boolean }> {
  const { data, fromCache } = await stocksCache.resolve(CACHE_KEY, loadStocks);
  return { ...data, fromCache };
}

/** Returns the cached quotes without contacting a provider. */
export function peekStocks(): SwrCacheEntry<StockInternalAPIResponse[]> | null {
  const entry = stocksCache.peek(CACHE_KEY);
  return entry ? { ...entry, data: entry.data.data } : null;
}
