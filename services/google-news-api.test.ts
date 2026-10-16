import assert from "node:assert/strict";
import test from "node:test";
import { fetchGoogleNewsAPI, type GoogleNewsOptions } from "./google-news-api";

const cases: { name: string; options?: GoogleNewsOptions; hl: string; gl: string }[] = [
  { name: "omitted options", hl: "en", gl: "us" },
  { name: "empty options", options: {}, hl: "en", gl: "us" },
  { name: "explicit locale", options: { hl: "pt", gl: "br" }, hl: "pt", gl: "br" },
  { name: "language only", options: { hl: "es" }, hl: "es", gl: "us" },
  { name: "country only", options: { gl: "gb" }, hl: "en", gl: "gb" },
  { name: "blank locale", options: { hl: " ", gl: "" }, hl: "en", gl: "us" },
  { name: "padded locale", options: { hl: " fr ", gl: " ca " }, hl: "fr", gl: "ca" },
];

for (const { name, options, hl, gl } of cases) {
  test(`Google News sends the expected locale with ${name}`, async (t) => {
    const payload = { news_results: [{ title: "Example news" }] };
    t.mock.method(globalThis, "fetch", async (input: string) => {
      const params = new URL(input).searchParams;
      assert.equal(params.get("hl"), hl);
      assert.equal(params.get("gl"), gl);
      assert.equal(params.get("engine"), "google_news_light");
      assert.equal(params.get("q"), "breaking news world");
      assert.equal(params.has("api_key"), true);
      return Response.json(payload);
    });

    assert.deepEqual(await fetchGoogleNewsAPI(options), payload);
  });
}
