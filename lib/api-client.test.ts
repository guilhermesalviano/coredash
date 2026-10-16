import assert from "node:assert/strict";
import test from "node:test";
import { ApiClientError, fetchJson } from "./api-client";

test("unwraps successful envelopes, including null mutation results", async (t) => {
  for (const data of [[{ id: 1 }], null]) {
    t.mock.method(globalThis, "fetch", async () => Response.json({ data, message: "ok" }));
    assert.deepEqual(await fetchJson("/api/todo"), data);
  }
});

test("preserves responses without an envelope", async (t) => {
  for (const data of [{ enabled: true }, [{ id: 1 }]]) {
    t.mock.method(globalThis, "fetch", async () => Response.json(data));
    assert.deepEqual(await fetchJson("/api/example"), data);
  }
});

for (const body of ["<html>Login required</html>", "", "   ", "null", "true", "42", '"text"']) {
  test(`rejects an invalid successful API response: ${JSON.stringify(body)}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => new Response(body, { status: 200 }));
    await assert.rejects(fetchJson("/api/todo"), (error: unknown) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 200);
      return true;
    });
  });
}

test("preserves JSON API error messages and status", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Invalid task" }, { status: 400 }));
  await assert.rejects(fetchJson("/api/todo"), {
    name: "ApiClientError",
    message: "Invalid task",
    status: 400,
  });
});

test("preserves non-JSON gateway errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Bad Gateway</html>", { status: 502 }));
  await assert.rejects(fetchJson("/api/todo"), {
    name: "ApiClientError",
    message: "<html>Bad Gateway</html>",
    status: 502,
  });
});

test("uses the HTTP status text for an empty error response", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("", { status: 503, statusText: "Service Unavailable" }));
  await assert.rejects(fetchJson("/api/todo"), {
    name: "ApiClientError",
    message: "Service Unavailable",
    status: 503,
  });
});

test("aborts pending requests and reports a timeout", async (t) => {
  t.mock.method(globalThis, "fetch", (_input: RequestInfo | URL, init?: RequestInit) => {
    const signal = init?.signal;
    assert.ok(signal);
    return new Promise<Response>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  });
  await assert.rejects(fetchJson("/api/todo", undefined, 10), {
    name: "ApiClientError",
    message: "Request timed out after 10ms",
    status: 504,
  });
});
