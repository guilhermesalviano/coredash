import assert from "node:assert/strict";
import test from "node:test";

import {
  applySettingsPatch,
  assertResolvedSettings,
  emptyStoredSettings,
  resolveSettings,
  toPublicSettingsResponse,
  validateRuntimeSettingsPatch,
  type EnvironmentSettings,
} from "@/features/settings/server/setup-validation";

function environment(overrides: Partial<EnvironmentSettings> = {}): EnvironmentSettings {
  return {
    timezone: "America/Sao_Paulo",
    latitude: "-23.55",
    longitude: "-46.63",
    city: "",
    calendarIds: [],
    googleClientEmail: "",
    gmailClientId: "",
    newsApiKey: "",
    serpApiKey: "",
    brapiToken: "",
    googlePrivateKey: "",
    gmailClientSecret: "",
    gmailRefreshToken: "",
    ...overrides,
  };
}

test("validates and normalizes runtime settings", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: " America/Sao_Paulo ",
    latitude: "-23.5",
    longitude: "-46.6",
    calendarIds: ["work", " work ", "", "home"],
    city: " São Paulo ",
  }), {
    timezone: "America/Sao_Paulo",
    latitude: "-23.5",
    longitude: "-46.6",
    calendarIds: ["work", "home"],
    city: "São Paulo",
  });
});

test("allows clearing an override and ignores a blank secret", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: null,
    calendarIds: null,
    newsApiKey: "   ",
    city: "",
  }), {
    timezone: null,
    calendarIds: null,
    city: null,
  });
});

test("rejects invalid runtime settings", () => {
  assert.throws(() => validateRuntimeSettingsPatch({ timezone: "Mars/Crater" }), /IANA timezone/);
  assert.throws(() => validateRuntimeSettingsPatch({ latitude: "91" }), /latitude/);
  assert.throws(() => validateRuntimeSettingsPatch({ longitude: "-181" }), /longitude/);
  assert.throws(() => validateRuntimeSettingsPatch({ timezone: "" }), /timezone must be configured/);
  assert.throws(() => validateRuntimeSettingsPatch({ aiModel: "openai/gpt-4o-mini" }), /Unknown setting/);
  assert.throws(() => validateRuntimeSettingsPatch({ spotifyClientId: "client" }), /Unknown setting/);
  assert.throws(() => validateRuntimeSettingsPatch({ cronSchedule: "0 8 * * 6" }), /Unknown setting/);
  assert.throws(() => validateRuntimeSettingsPatch({ unknown: "value" }), /Unknown setting/);
});

test("setup is required until timezone and coordinates are valid", () => {
  const missing = resolveSettings(emptyStoredSettings(), environment({ timezone: "", latitude: "", longitude: "" }));
  assert.deepEqual(toPublicSettingsResponse(missing, emptyStoredSettings()).setupRequired, true);

  const ready = resolveSettings(emptyStoredSettings(), environment());
  const pub = toPublicSettingsResponse(ready, emptyStoredSettings());
  assert.equal(pub.setupRequired, false);
  assert.equal(pub.settings.timezone, "America/Sao_Paulo");
  assert.equal(pub.settings.latitude, "-23.55");
  assert.equal(pub.settings.longitude, "-46.63");
});

test("a blank secret keeps the stored key", () => {
  const stored = { ...emptyStoredSettings(), newsApiKey: "news-stored" };
  const patch = validateRuntimeSettingsPatch({ newsApiKey: "" });
  const next = applySettingsPatch(stored, patch);
  assert.equal(next.newsApiKey, "news-stored");
  const resolved = resolveSettings(next, environment());
  assert.equal(resolved.newsApiKey, "news-stored");
  assert.doesNotThrow(() => assertResolvedSettings(patch, resolved));
  assert.equal(JSON.stringify(toPublicSettingsResponse(resolved, next)).includes("news-stored"), false);
  assert.equal(toPublicSettingsResponse(resolved, next).secrets.newsApiKey, true);
});

test("optional news and stocks keys can stay empty", () => {
  const patch = validateRuntimeSettingsPatch({ city: "São Paulo" });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment());
  assert.equal(resolved.newsApiKey, "");
  assert.equal(resolved.brapiToken, "");
  assert.doesNotThrow(() => assertResolvedSettings(patch, resolved));
});

test("saving without a timezone or coordinates is rejected", () => {
  const patch = validateRuntimeSettingsPatch({ city: "São Paulo" });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment({
    timezone: "",
    latitude: "",
    longitude: "",
  }));
  assert.throws(() => assertResolvedSettings(patch, resolved), /timezone, latitude, longitude must be configured/);
});

test("gmail credentials must be saved together when the group is edited", () => {
  const patch = validateRuntimeSettingsPatch({ gmailClientId: "client-id" });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment());
  assert.throws(() => assertResolvedSettings(patch, resolved), /Gmail credentials must be configured together/);
});

test("an untouched partial integration does not block setup", () => {
  const patch = validateRuntimeSettingsPatch({
    timezone: "America/Sao_Paulo",
    latitude: "-23.5",
    longitude: "-46.6",
  });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment({
    gmailClientId: "only-the-id",
  }));
  assert.equal(resolved.gmailClientId, "only-the-id");
  assert.doesNotThrow(() => assertResolvedSettings(patch, resolved));
});

test("normalizes stored private keys without returning them publicly", () => {
  const stored = { ...emptyStoredSettings(), googlePrivateKey: "line1\\nline2" };
  const resolved = resolveSettings(stored, environment());
  assert.equal(resolved.googlePrivateKey, "line1\nline2");
  assert.equal(JSON.stringify(toPublicSettingsResponse(resolved, stored)).includes("line1"), false);
  assert.equal(toPublicSettingsResponse(resolved, stored).secrets.googlePrivateKey, true);
});
