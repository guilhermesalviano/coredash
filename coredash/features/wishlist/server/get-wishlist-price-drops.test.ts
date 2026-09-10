import assert from "node:assert/strict";
import test from "node:test";

import { findWishlistPriceDrops, parseWishlistPrice, type WishlistPriceSnapshot } from "./get-wishlist-price-drops";

const snapshots: WishlistPriceSnapshot[] = [
  { id: 4, title: "Large drop", price: "R$ 100,00", link: "https://www.amazon.com.br/dp/4", searchDate: new Date("2026-09-10") },
  { id: 3, title: "Large drop", price: "R$ 250,00", link: "https://www.amazon.com.br/dp/4", searchDate: new Date("2026-09-09") },
  { id: 2, title: "Small drop", price: "R$ 90,00", link: "https://www.amazon.com.br/dp/2", searchDate: new Date("2026-09-10") },
  { id: 1, title: "Small drop", price: "R$ 100,00", link: "https://www.amazon.com.br/dp/2", searchDate: new Date("2026-09-09") },
  { id: 6, title: "Price increase", price: "R$ 120,00", link: "https://www.amazon.com.br/dp/6", searchDate: new Date("2026-09-10") },
  { id: 5, title: "Price increase", price: "R$ 100,00", link: "https://www.amazon.com.br/dp/6", searchDate: new Date("2026-09-09") },
];

test("parses Brazilian prices with currency and thousands separators", () => {
  assert.equal(parseWishlistPrice("R$ 1.234,56"), 1234.56);
  assert.equal(parseWishlistPrice("R$ 1.234"), 1234);
  assert.equal(parseWishlistPrice("R$ 99,90"), 99.9);
  assert.equal(parseWishlistPrice(""), null);
});

test("ranks products by the largest decrease from the previous snapshot", () => {
  const drops = findWishlistPriceDrops(snapshots);

  assert.deepEqual(drops.map((drop) => [drop.name, drop.savings, Number(drop.percentage.toFixed(1))]), [
    ["Large drop", 150, 60],
    ["Small drop", 10, 10],
  ]);
  assert.equal(drops[0].currentPrice, "R$ 100,00");
  assert.equal(drops[0].previousPrice, "R$ 250,00");
});

test("ignores products without two priced snapshots and price increases", () => {
  const drops = findWishlistPriceDrops([
    { id: 1, title: "Only one", price: "R$ 10,00", link: "", searchDate: new Date("2026-09-10") },
    ...snapshots.filter((snapshot) => snapshot.title === "Price increase"),
  ]);

  assert.deepEqual(drops, []);
});
