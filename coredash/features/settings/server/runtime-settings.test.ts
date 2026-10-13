import assert from "node:assert/strict";
import test from "node:test";

import { validateRuntimeSettingsPatch } from "@/features/settings/server/runtime-settings";

test("validates and normalizes runtime settings", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: " America/Sao_Paulo ",
    latitude: "-23.5",
    longitude: "-46.6",
    aiModel: " gemma3:4b ",
    calendarIds: ["work", " work ", "", "home"],
  }), {
    timezone: "America/Sao_Paulo",
    latitude: "-23.5",
    longitude: "-46.6",
    aiModel: "gemma3:4b",
    calendarIds: ["work", "home"],
  });
});

test("allows clearing an override", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: null,
    calendarIds: null,
  }), {
    timezone: null,
    calendarIds: null,
  });
});

test("rejects invalid runtime settings", () => {
  assert.throws(() => validateRuntimeSettingsPatch({ timezone: "Mars/Crater" }), /IANA timezone/);
  assert.throws(() => validateRuntimeSettingsPatch({ latitude: "91" }), /latitude/);
  assert.throws(() => validateRuntimeSettingsPatch({ longitude: "-181" }), /longitude/);
  assert.throws(() => validateRuntimeSettingsPatch({ cronSchedule: "0 8 * * 6" }), /Unknown setting/);
  assert.throws(() => validateRuntimeSettingsPatch({ unknown: "value" }), /Unknown setting/);
});
