import assert from "node:assert/strict";
import test from "node:test";

import { amazonBrazilUrl, scrapeAmazonWishlist, scraperInternals } from "./amazon-wishlist-scraper";

const firstPage = `
  <ul>
    <li id="item_1" data-itemid="one">
      <a id="itemName_1" href="/dp/B000000001">  First product  </a>
      <span class="a-price"><span class="a-offscreen">R$ 10,99</span></span>
    </li>
  </ul>
  <a class="a-last" href="/hz/wishlist/ls/list?page=2">Próxima</a>
`;

const secondPage = `
  <div id="item_2" data-itemid="two">
    <h2><a href="/gp/product/B000000002">Second product</a></h2>
    <span class="a-price"><span class="a-offscreen">R$ 20,00</span></span>
  </div>
`;

test("scrapes titled items, prices, product links, and pagination", async () => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    return new Response(url.includes("page=2") ? secondPage : firstPage, { status: 200 });
  };

  const items = await scrapeAmazonWishlist("list/id", fetchImpl);

  assert.deepEqual(items, [
    {
      title: "First product",
      price: "R$ 10,99",
      link: "https://www.amazon.com.br/dp/B000000001",
    },
    {
      title: "Second product",
      price: "R$ 20,00",
      link: "https://www.amazon.com.br/gp/product/B000000002",
    },
  ]);
  assert.equal(requests.length, 2);
  assert.match(String((requests[0].init?.headers as Record<string, string>)["User-Agent"]), /^Mozilla\//);
  assert.match(requests[0].url, /sort=price-asc/);
  assert.match(requests[0].url, /filter=unpurchased/);
});

test("ignores missing titles and rejects non-Amazon Brazil URLs", () => {
  const items = scraperInternals.wishlistItemsFromPage(
    `<li data-itemid="missing"><a href="/dp/B000000003"></a></li>`,
    "https://www.amazon.com.br/hz/wishlist/ls/list",
  );

  assert.deepEqual(items, []);
  assert.equal(
    amazonBrazilUrl("https://www.amazon.com/gp/product/B000000004", "https://www.amazon.com.br/"),
    null,
  );
  assert.equal(amazonBrazilUrl("/dp/B000000005", "https://www.amazon.com.br/"), "https://www.amazon.com.br/dp/B000000005");
});

test("does not follow a pagination link outside Amazon Brazil", () => {
  assert.equal(
    scraperInternals.nextPageUrl(
      `<a class="a-last" href="https://example.com/page-2">Next</a>`,
      "https://www.amazon.com.br/hz/wishlist/ls/list",
    ),
    null,
  );
});

test("fails the scrape when a wishlist page cannot be fetched", async () => {
  await assert.rejects(
    scrapeAmazonWishlist("list", async () => new Response("blocked", { status: 503 })),
    /HTTP 503/,
  );
});
