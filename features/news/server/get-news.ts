import { ONE_MINUTE_IN_MS } from "@/constants";
import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { fetchGoogleNewsAPI } from "@/services/google-news-api";
import { fetchMediastackAPI } from "@/services/mediastack-api";
import { isErrorResponse } from "@/utils/check-service-error";
import { createSwrCache, type SwrCacheEntry } from "@/utils/in-memory-cache";
import { parseRelativeDate } from "@/utils/parse-relative-date";
import type { NewsItem } from "@/features/news/types";
import { differenceInHours } from "date-fns";
import { detectLocale, newsMarket, relativeHours, type Locale } from "@/lib/i18n";
import { globalSingleton } from "@/lib/global-singleton";

const newsCache = globalSingleton("newsCache", () => createSwrCache<NewsItem[]>({
  ttlMs: ONE_MINUTE_IN_MS * 30,
  staleMs: ONE_MINUTE_IN_MS * 120,
}));

function newsCacheKey(locale: Locale): string {
  const market = newsMarket(locale);
  return `${market.hl}:${market.gl}`;
}

export async function getNews(language?: string | null): Promise<NewsItem[]> {
  const locale = detectLocale(language);
  return newsCache.get(newsCacheKey(locale), () => loadNews(locale));
}

/** Returns the cached news without contacting the provider. */
export function peekNews(language?: string | null): SwrCacheEntry<NewsItem[]> | null {
  return newsCache.peek(newsCacheKey(detectLocale(language)));
}

async function loadNews(locale: Locale): Promise<NewsItem[]> {
  const market = newsMarket(locale);
  const settings = await getResolvedRuntimeSettings();
  const googleNews = await fetchGoogleNewsAPI({
    apiKey: settings.serpApiKey,
    hl: market.hl,
    gl: market.gl,
  });
  if (!isErrorResponse(googleNews) && googleNews.news_results?.length) {
    const data = googleNews.news_results
      .sort((a, b) => parseRelativeDate(b.date) - parseRelativeDate(a.date))
      .map((article, id) => ({
        id,
        source: article.date,
        title: `${article.title} - ${article.snippet ?? ""}`,
        tag: article.source,
        url: article.link,
      }))
      .slice(0, 4);

    return data;
  }

  const fallback = await fetchMediastackAPI(settings.newsApiKey);
  const data = fallback.data.map((article, id) => ({
    id,
    source: relativeHours(Math.max(0, differenceInHours(new Date(), new Date(article.published_at))), locale),
    title: article.title,
    tag: article.source,
    url: article.url,
  }));

  return data;
}

