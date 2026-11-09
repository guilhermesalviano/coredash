import assert from "node:assert/strict";
import test from "node:test";
import { createSwrCache } from "./in-memory-cache";

function clock(start = 1_000) {
  let current = start;
  return { now: () => current, advance: (ms: number) => { current += ms; } };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("concurrent misses share one loader call", async () => {
  const cache = createSwrCache<number>({ ttlMs: 100 });
  let calls = 0;
  const loader = async () => { calls += 1; await flush(); return 42; };

  const results = await Promise.all([cache.get("k", loader), cache.get("k", loader), cache.get("k", loader)]);

  assert.deepEqual(results, [42, 42, 42]);
  assert.equal(calls, 1);
});

test("fresh entries skip the loader and report fromCache", async () => {
  const time = clock();
  const cache = createSwrCache<number>({ ttlMs: 100, now: time.now });
  let calls = 0;
  const loader = async () => ++calls;

  assert.deepEqual(await cache.resolve("k", loader), { data: 1, fromCache: false });
  time.advance(99);
  assert.deepEqual(await cache.resolve("k", loader), { data: 1, fromCache: true });
  assert.equal(calls, 1);
});

test("stale entries are served immediately and refreshed in the background", async () => {
  const time = clock();
  const cache = createSwrCache<number>({ ttlMs: 100, staleMs: 400, now: time.now });
  let calls = 0;
  const loader = async () => ++calls;

  await cache.get("k", loader);
  time.advance(150);
  assert.equal(await cache.get("k", loader), 1);
  await flush();
  assert.equal(calls, 2);
  assert.equal(await cache.get("k", loader), 2);
  assert.equal(calls, 2);
});

test("a failed refresh keeps the stale entry and waits for the cooldown", async () => {
  const time = clock();
  const cache = createSwrCache<number>({ ttlMs: 100, staleMs: 10_000, failureCooldownMs: 1_000, now: time.now });
  let calls = 0;
  await cache.get("k", async () => 7);
  const failing = async () => { calls += 1; throw new Error("provider down"); };

  time.advance(150);
  assert.equal(await cache.get("k", failing), 7);
  await flush();
  assert.equal(await cache.get("k", failing), 7);
  await flush();
  assert.equal(calls, 1);

  time.advance(1_000);
  assert.equal(await cache.get("k", failing), 7);
  await flush();
  assert.equal(calls, 2);
});

test("entries past the stale window block on the loader and surface its error", async () => {
  const time = clock();
  const cache = createSwrCache<number>({ ttlMs: 100, staleMs: 100, now: time.now });
  await cache.get("k", async () => 1);

  time.advance(200);
  assert.equal(cache.peek("k"), null);
  await assert.rejects(cache.get("k", async () => { throw new Error("boom"); }), /boom/);
  assert.equal(await cache.get("k", async () => 2), 2);
});

test("delete during a load discards that load's result", async () => {
  const cache = createSwrCache<number>({ ttlMs: 100 });
  let release: (value: number) => void = () => {};
  const slow = cache.get("k", () => new Promise<number>((resolve) => { release = resolve; }));
  await flush();
  cache.delete("k");
  release(1);

  assert.equal(await slow, 1);
  assert.equal(cache.peek("k"), null);
});

test("peek reports freshness without calling a loader", async () => {
  const time = clock();
  const cache = createSwrCache<string>({ ttlMs: 100, staleMs: 100, now: time.now });
  assert.equal(cache.peek("k"), null);
  await cache.get("k", async () => "v");
  assert.deepEqual(cache.peek("k"), { data: "v", fetchedAt: 1_000, fresh: true });
  time.advance(120);
  assert.deepEqual(cache.peek("k"), { data: "v", fetchedAt: 1_000, fresh: false });
});
