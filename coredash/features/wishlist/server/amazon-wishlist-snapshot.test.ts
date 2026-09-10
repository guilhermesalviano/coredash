import assert from "node:assert/strict";
import test from "node:test";
import type { InsertResult } from "typeorm";

import { writeWishlistSnapshots, type WishlistSnapshotRepository } from "./amazon-wishlist-snapshot";

test("continues inserting snapshots after an individual insert failure", async () => {
  const calls: string[] = [];
  const searchDate = new Date("2026-09-10T08:00:00.000Z");
  const repository: WishlistSnapshotRepository = {
    async insert(values) {
      calls.push(values.title);
      if (values.title === "Broken item") throw new Error("database write failed");
      return {} as InsertResult;
    },
  };

  const result = await writeWishlistSnapshots(
    [
      { title: "First item", price: "R$ 1,00", link: "https://www.amazon.com.br/dp/1" },
      { title: "Broken item", price: "R$ 2,00", link: "https://www.amazon.com.br/dp/2" },
      { title: "Last item", price: "R$ 3,00", link: "https://www.amazon.com.br/dp/3" },
    ],
    searchDate,
    repository,
  );

  assert.deepEqual(result, { attempted: 3, inserted: 2, failed: 1 });
  assert.deepEqual(calls, ["First item", "Broken item", "Last item"]);
});
