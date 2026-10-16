import assert from "node:assert/strict";
import test from "node:test";
import { resolveBaseUrl } from "./projectQrButton";

test("resolveBaseUrl prioritizes custom URL when provided", () => {
  const url = resolveBaseUrl("https://example.com/custom", "http://localhost:3000");
  assert.equal(url, "https://example.com/custom");
});

test("resolveBaseUrl uses client origin if no custom URL is provided", () => {
  const url = resolveBaseUrl(undefined, "http://192.168.1.50:3000");
  assert.equal(url, "http://192.168.1.50:3000");
});

test("resolveBaseUrl falls back to environment or localhost when origin is unavailable", () => {
  const url = resolveBaseUrl(undefined, undefined);
  assert.ok(url.startsWith("http"));
});
