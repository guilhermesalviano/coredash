import assert from "node:assert/strict";
import test from "node:test";
import { ADHD_REWARD_MESSAGES, ALL_CLEAR_MESSAGE, getRandomRewardMessage, playTaskCompletionChime, fireTaskRewardConfetti } from "./rewards";

test("getRandomRewardMessage returns an affirmation from the message pool", () => {
  const message = getRandomRewardMessage();
  assert.ok(ADHD_REWARD_MESSAGES.includes(message as typeof ADHD_REWARD_MESSAGES[number]));
});

test("ALL_CLEAR_MESSAGE is defined", () => {
  assert.ok(ALL_CLEAR_MESSAGE.length > 0);
});

test("playTaskCompletionChime and fireTaskRewardConfetti do not throw in node environment", () => {
  assert.doesNotThrow(() => playTaskCompletionChime());
  assert.doesNotThrow(() => fireTaskRewardConfetti());
});
