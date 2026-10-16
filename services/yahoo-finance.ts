import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchYahooPrice(symbols: string[]) {
  const results = await Promise.all(
    symbols.map((symbol) => yahooFinance.quote(symbol))
  );

  return { results };
}