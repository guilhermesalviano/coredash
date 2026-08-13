import { ONE_MINUTE_IN_MS } from "@/constants";
import { STOCKS } from "@/constants/stocks";
import { formatResponse } from "@/lib/api-response";
import logger from "@/lib/logger";
import { fetchBrapiAPI } from "@/services/brapi-api";
import { fetchYahooPrice } from "@/services/yahoo-finance";
import { StockInternalAPIResponse } from "@/types/stock-api";
import { isErrorResponse } from "@/utils/check-service-error";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { NextRequest, NextResponse } from "next/server";

interface StockResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

function mapStocks(results: StockResult[]): StockInternalAPIResponse[] {
  return results.map((stock) => ({
    ticker: stock.symbol,
    price: stock.regularMarketPrice,
    priceOpened: stock.regularMarketDayHigh,
    change: stock.regularMarketChange,
    pct: stock.regularMarketChangePercent,
  }));
}

const stocksCache = createMemoryCache<StockInternalAPIResponse[]>(ONE_MINUTE_IN_MS * 10);

export async function GET(req: NextRequest) {
  try {
    const cached = stocksCache.get("default");
    if (cached) {
      logger.info("Stocks data retrieved from cache successfully");
      return formatResponse(req, { message: "Stocks data from cache successfully", data: cached });
    }

    const symbols = Object.values(STOCKS).flat();

    const brapiData = await fetchBrapiAPI(symbols.join(","));
    if (!isErrorResponse(brapiData) && brapiData.results?.length) {
      const data = mapStocks(brapiData.results);
      stocksCache.set("default", data);

      return formatResponse(req, {
        message: "Stocks data retrieved successfully",
        source: "brapi",
        data,
      }, { status: 200 });
    }

    const yahooSymbols = symbols.map((s) => `${s}.SA`);
    const yahooData = await fetchYahooPrice(yahooSymbols);
    if (yahooData?.results?.length) {
      const data = mapStocks(yahooData.results as StockResult[]);
      stocksCache.set("default", data);

      return formatResponse(req, {
        message: "Stocks data retrieved successfully",
        source: "yahoo",
        data,
      }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Nenhuma ação encontrada no momento" },
      { status: 404 }
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to retrieve stocks data" },
      { status: 500 }
    );
  }
}