import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeActiveCards } from "@/hooks/useActiveCards";

test("drops removed card ids such as spotify from a saved selection", () => {
  assert.deepEqual(
    sanitizeActiveCards(["weather", "spotify", "todo", 1, null]),
    ["weather", "todo"],
  );
});

test("keeps an empty selection when every saved card was removed", () => {
  assert.deepEqual(sanitizeActiveCards(["spotify"]), []);
});

test("uses the default cards when stored data is not a list", () => {
  assert.deepEqual(sanitizeActiveCards(null), ["weather", "calendar", "gmail", "todo"]);
});
