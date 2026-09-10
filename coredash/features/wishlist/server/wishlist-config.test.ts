import assert from "node:assert/strict";
import test from "node:test";

import { extractWishlistId } from "./wishlist-config";

test("extracts IDs from Amazon Brazil wishlist URLs and accepts raw IDs", () => {
  assert.equal(extractWishlistId("ABC123"), "ABC123");
  assert.equal(
    extractWishlistId("https://www.amazon.com.br/hz/wishlist/ls/ABC123?sort=price-asc"),
    "ABC123",
  );
});

test("rejects invalid or non-Brazil wishlist URLs", () => {
  assert.equal(extractWishlistId("https://www.amazon.com/hz/wishlist/ls/ABC123"), null);
  assert.equal(extractWishlistId("https://www.amazon.com.br/dp/ABC123"), null);
  assert.equal(extractWishlistId("not a wishlist"), null);
});
