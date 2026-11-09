import { ONE_MINUTE_IN_MS } from "@/constants";
import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { fetchGoogleNewsAPI } from "@/services/google-news-api";
import { fetchMediastackAPI } from "@/services/mediastack-api";
import { isErrorResponse } from "@/utils/check-service-error";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { parseRelativeDate } from "@/utils/parse-relative-date";
import type { NewsItem } from "@/features/news/types";
import { differenceInHours } from "date-fns";
import { detectLocale, newsMarket, relativeHours } from "@/lib/i18n";

const newsCache = createMemoryCache<NewsItem[]>(ONE_MINUTE_IN_MS * 30);

export async function getNews(language?: string | null): Promise<NewsItem[]> {
  const locale = detectLocale(language);
  const market = newsMarket(locale);
  const cacheKey = `${market.hl}:${market.gl}`;
  const cached = newsCache.get(cacheKey);
  if (cached) return cached;

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

    newsCache.set(cacheKey, data);
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

  newsCache.set(cacheKey, data);
  return data;
}

