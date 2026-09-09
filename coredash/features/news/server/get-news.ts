import { ONE_MINUTE_IN_MS } from "@/constants";
import { fetchGoogleNewsAPI } from "@/services/google-news-api";
import { fetchMediastackAPI } from "@/services/mediastack-api";
import { isErrorResponse } from "@/utils/check-service-error";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { parseRelativeDate } from "@/utils/parse-relative-date";
import type { NewsItem } from "@/features/news/types";
import { differenceInHours } from "date-fns";

const newsCache = createMemoryCache<NewsItem[]>(ONE_MINUTE_IN_MS * 30);

export async function getNews(): Promise<NewsItem[]> {
  const cached = newsCache.get("default");
  if (cached) return cached;

  const googleNews = await fetchGoogleNewsAPI();
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

    newsCache.set("default", data);
    return data;
  }

  const fallback = await fetchMediastackAPI();
  const data = fallback.data.map((article, id) => ({
    id,
    source: `about ${differenceInHours(new Date(), new Date(article.published_at))} hours ago`,
    title: article.title,
    tag: article.source,
    url: article.url,
  }));

  newsCache.set("default", data);
  return data;
}

