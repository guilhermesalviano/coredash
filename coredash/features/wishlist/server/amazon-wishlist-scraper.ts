import * as cheerio from "cheerio";
import type { Element } from "domhandler";

import type { WishlistScrapedItem } from "@/features/wishlist/types";

const AMAZON_BRAZIL_HOSTS = new Set(["amazon.com.br", "www.amazon.com.br"]);
const WISHLIST_URL = "https://www.amazon.com.br/hz/wishlist/ls/";
const MAX_WISHLIST_PAGES = 100;

const browserHeaders: HeadersInit = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://www.amazon.com.br/",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function amazonBrazilUrl(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "https:" || !AMAZON_BRAZIL_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function firstText($container: cheerio.Cheerio<Element>, selectors: string[]): string {
  for (const selector of selectors) {
    const text = $container.find(selector).first().text().replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

function productLink($container: cheerio.Cheerio<Element>, pageUrl: string): string {
  const href = $container
    .find("a[href]")
    .toArray()
    .map((element) => $container.find(element).attr("href") ?? "")
    .find((candidate) => /(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/)/i.test(candidate));

  if (!href) return "";
  return amazonBrazilUrl(href, pageUrl) ?? "";
}

function wishlistItemsFromPage(html: string, pageUrl: string): WishlistScrapedItem[] {
  const $ = cheerio.load(html);
  const seen = new Set<Element>();
  const items: WishlistScrapedItem[] = [];

  $("[data-itemid], li[id^='item_'], div[id^='item_']").each((_, element) => {
    if (seen.has(element)) return;
    seen.add(element);

    const container = $(element);
    const title = firstText(container, [
      "a[id^='itemName_']",
      "h2 a",
      "h2",
      "[class*='itemName']",
      "a.a-link-normal",
    ]);

    if (!title) return;

    items.push({
      title,
      price: firstText(container, [".a-price .a-offscreen", ".a-price", "[class*='price']"]),
      link: productLink(container, pageUrl),
    });
  });

  return items;
}

function nextPageUrl(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const link = $(
    "li.a-last a[href], a.a-last[href], a[rel='next'][href], " +
      "a[aria-label*='next' i][href], a[aria-label*='próxima' i][href], " +
      "a[title*='next' i][href], a[title*='próxima' i][href]",
  ).first();

  if (!link.length) return null;
  return amazonBrazilUrl(link.attr("href") ?? "", pageUrl);
}

export async function scrapeAmazonWishlist(
  wishlistId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WishlistScrapedItem[]> {
  const initialUrl = `${WISHLIST_URL}${encodeURIComponent(wishlistId)}?_encoding=UTF8&sort=price-asc&filter=unpurchased`;
  const visited = new Set<string>();
  const items: WishlistScrapedItem[] = [];
  let pageUrl: string | null = initialUrl;

  while (pageUrl) {
    if (visited.has(pageUrl)) break;
    if (visited.size >= MAX_WISHLIST_PAGES) {
      throw new Error(`Wishlist pagination exceeded ${MAX_WISHLIST_PAGES} pages`);
    }
    visited.add(pageUrl);

    let response: Response;
    try {
      response = await fetchImpl(pageUrl, {
        headers: browserHeaders,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      throw new Error(`Failed to fetch Amazon wishlist page ${pageUrl}: ${errorMessage(error)}`);
    }

    if (!response.ok) {
      throw new Error(`Amazon wishlist page returned HTTP ${response.status}: ${pageUrl}`);
    }

    const html = await response.text();
    items.push(...wishlistItemsFromPage(html, pageUrl));
    pageUrl = nextPageUrl(html, pageUrl);
  }

  return items;
}

export const scraperInternals = {
  nextPageUrl,
  wishlistItemsFromPage,
};
