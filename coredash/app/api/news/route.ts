import { ONE_MINUTE_IN_MS } from "@/constants";
import logger from "@/lib/logger";
import { fetchGoogleNewsAPI } from "@/services/google-news-api";
import { fetchMediastackAPI } from "@/services/mediastack-api";
import { isErrorResponse } from "@/utils/check-service-error";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { parseRelativeDate } from "@/utils/parse-relative-date";
import { differenceInHours } from "date-fns";
import { apiResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

interface NewsReturn {
  id: number;
  source: string;
  title: string;
  tag: string;
  url: string | undefined;
}

const newsCache = createMemoryCache<NewsReturn[]>(ONE_MINUTE_IN_MS * 30);

export async function GET(req: NextRequest) {
  try {
    const cached = newsCache.get("default");
    if (cached) {
      logger.info("News data retrieved from cache successfully");
      return apiResponse(req, { message: "News data from cache successfully", data: cached });
    }

    const googleNewsData = await fetchGoogleNewsAPI();

    if (googleNewsData && !isErrorResponse(googleNewsData) && googleNewsData.news_results?.length) {
      const { news_results } = googleNewsData;

      const news = news_results
        .sort((a, b) => parseRelativeDate(b.date) - parseRelativeDate(a.date))
        .map((article, index) => {
          return {
            id: index,
            source: article.date,
            title: `${article.title} - ${article.snippet}`,
            tag: article.source,
            url: article.link,
          };
        }).slice(0, 4);

      newsCache.set("default", news);

      return apiResponse(req, { message: "News data retrieved successfully from serpapi", data: news });
    }

    const mediastackData = await fetchMediastackAPI();

    const news = mediastackData.data.map((article, index) => ({
      id: index,
      source: `about ${differenceInHours(new Date(), new Date(article.published_at))} hours ago`,
      title: article.title,
      tag: article.source,
      url: article.url,
    }));

    newsCache.set("default", news);

    return apiResponse(req, { message: "News data retrieved successfully from mediastack", data: news });
  } catch (error: unknown) {
    console.error(error);
    return apiResponse(req, { error: "Failed to retrieve news data" }, { status: 500 });
  }
}