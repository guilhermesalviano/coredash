import assert from "node:assert/strict";
import test from "node:test";

import { validateRuntimeSettingsPatch } from "@/features/settings/server/runtime-settings";

test("validates and normalizes runtime settings", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: " America/Sao_Paulo ",
    latitude: "-23.5",
    longitude: "-46.6",
    cronSchedule: "0 8 * * 6",
    aiModel: " gemma3:4b ",
    calendarIds: ["work", " work ", "", "home"],
  }), {
    timezone: "America/Sao_Paulo",
    latitude: "-23.5",
    longitude: "-46.6",
    cronSchedule: "0 8 * * 6",
    aiModel: "gemma3:4b",
    calendarIds: ["work", "home"],
  });
});

test("allows clearing an override and disabling the cron", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: null,
    cronSchedule: "",
    calendarIds: null,
  }), {
    timezone: null,
    cronSchedule: null,
    calendarIds: null,
  });
});

test("rejects invalid runtime settings", () => {
  assert.throws(() => validateRuntimeSettingsPatch({ timezone: "Mars/Crater" }), /IANA timezone/);
  assert.throws(() => validateRuntimeSettingsPatch({ latitude: "91" }), /latitude/);
  assert.throws(() => validateRuntimeSettingsPatch({ longitude: "-181" }), /longitude/);
  assert.throws(() => validateRuntimeSettingsPatch({ cronSchedule: "every Saturday" }), /five-field/);
  assert.throws(() => validateRuntimeSettingsPatch({ unknown: "value" }), /Unknown setting/);
});
