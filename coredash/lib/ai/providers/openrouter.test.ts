import assert from "node:assert/strict";
import test from "node:test";

import { collectOpenRouterDeltas, openRouterMessages, parseOpenRouterSseLine } from "@/lib/ai/providers/openrouter";

test("builds an OpenAI-compatible message list", () => {
  assert.deepEqual(openRouterMessages({
    systemInstruction: "Be brief",
    history: [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello" }],
    prompt: "Next",
  }), [
    { role: "system", content: "Be brief" },
    { role: "user", content: "Hi" },
    { role: "assistant", content: "Hello" },
    { role: "user", content: "Next" },
  ]);
});

test("reads streamed OpenRouter text deltas and ignores the done marker", () => {
  const payload = [
    'data: {"choices":[{"delta":{"content":"Hello"}}]}',
    "",
    'data: {"choices":[{"delta":{"content":" there"}}]}',
    "data: [DONE]",
    "not json",
  ].join("\n");

  assert.deepEqual(collectOpenRouterDeltas(payload), ["Hello", " there"]);
  assert.equal(parseOpenRouterSseLine("data: [DONE]"), null);
  assert.equal(parseOpenRouterSseLine("data: {"), null);
});
