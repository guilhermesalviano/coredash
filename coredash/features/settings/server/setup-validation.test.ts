import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_OPENROUTER_MODEL } from "@/features/settings/setup-fields";
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
    aiModel: DEFAULT_OPENROUTER_MODEL,
    personalContext: "",
    calendarIds: [],
    googleClientEmail: "",
    gmailClientId: "",
    spotifyClientId: "",
    openRouterApiKey: "",
    newsApiKey: "",
    serpApiKey: "",
    brapiToken: "",
    googlePrivateKey: "",
    gmailClientSecret: "",
    gmailRefreshToken: "",
    spotifyClientSecret: "",
    spotifyRefreshToken: "",
    ...overrides,
  };
}

test("validates and normalizes runtime settings", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: " America/Sao_Paulo ",
    latitude: "-23.5",
    longitude: "-46.6",
    aiModel: " openai/gpt-4o-mini ",
    calendarIds: ["work", " work ", "", "home"],
    city: " São Paulo ",
  }), {
    timezone: "America/Sao_Paulo",
    latitude: "-23.5",
    longitude: "-46.6",
    aiModel: "openai/gpt-4o-mini",
    calendarIds: ["work", "home"],
    city: "São Paulo",
  });
});

test("allows clearing an override and ignores a blank secret", () => {
  assert.deepEqual(validateRuntimeSettingsPatch({
    timezone: null,
    calendarIds: null,
    openRouterApiKey: "   ",
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
  assert.throws(() => validateRuntimeSettingsPatch({ aiModel: "" }), /aiModel must be configured/);
  assert.throws(() => validateRuntimeSettingsPatch({ cronSchedule: "0 8 * * 6" }), /Unknown setting/);
  assert.throws(() => validateRuntimeSettingsPatch({ unknown: "value" }), /Unknown setting/);
});

test("setup is required until an OpenRouter key is available", () => {
  const missing = resolveSettings(emptyStoredSettings(), environment());
  assert.equal(toPublicSettingsResponse(missing, emptyStoredSettings()).setupRequired, true);

  const ready = resolveSettings(emptyStoredSettings(), environment({ openRouterApiKey: "sk-or-test" }));
  const pub = toPublicSettingsResponse(ready, emptyStoredSettings());
  assert.equal(pub.setupRequired, false);
  assert.equal(pub.secrets.openRouterApiKey, true);
  assert.equal(JSON.stringify(pub).includes("sk-or-test"), false);
});

test("a blank secret keeps the stored key", () => {
  const stored = { ...emptyStoredSettings(), openRouterApiKey: "sk-stored" };
  const patch = validateRuntimeSettingsPatch({ openRouterApiKey: "" });
  const next = applySettingsPatch(stored, patch);
  assert.equal(next.openRouterApiKey, "sk-stored");
  const resolved = resolveSettings(next, environment());
  assert.equal(resolved.openRouterApiKey, "sk-stored");
  assert.doesNotThrow(() => assertResolvedSettings(patch, resolved));
});

test("optional news and stocks keys can stay empty", () => {
  const patch = validateRuntimeSettingsPatch({ aiModel: DEFAULT_OPENROUTER_MODEL });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment({
    openRouterApiKey: "sk-or-test",
  }));
  assert.equal(resolved.newsApiKey, "");
  assert.equal(resolved.brapiToken, "");
  assert.doesNotThrow(() => assertResolvedSettings(patch, resolved));
});

test("saving without an OpenRouter key is rejected", () => {
  const patch = validateRuntimeSettingsPatch({ aiModel: DEFAULT_OPENROUTER_MODEL });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment());
  assert.throws(() => assertResolvedSettings(patch, resolved), /openRouterApiKey must be configured/);
});

test("gmail credentials must be saved together when the group is edited", () => {
  const patch = validateRuntimeSettingsPatch({ gmailClientId: "client-id" });
  const resolved = resolveSettings(
    applySettingsPatch(emptyStoredSettings(), patch),
    environment({ openRouterApiKey: "sk-or-test" }),
  );
  assert.throws(() => assertResolvedSettings(patch, resolved), /Gmail credentials must be configured together/);
});

test("an untouched partial integration does not block setup", () => {
  const patch = validateRuntimeSettingsPatch({
    timezone: "America/Sao_Paulo",
    latitude: "-23.5",
    longitude: "-46.6",
    aiModel: DEFAULT_OPENROUTER_MODEL,
  });
  const resolved = resolveSettings(applySettingsPatch(emptyStoredSettings(), patch), environment({
    openRouterApiKey: "sk-or-test",
    gmailClientId: "only-the-id",
  }));
  assert.equal(resolved.gmailClientId, "only-the-id");
  assert.doesNotThrow(() => assertResolvedSettings(patch, resolved));
});

test("normalizes stored private keys without returning them publicly", () => {
  const stored = { ...emptyStoredSettings(), googlePrivateKey: "line1\\nline2" };
  const resolved = resolveSettings(stored, environment({ openRouterApiKey: "sk-or-test" }));
  assert.equal(resolved.googlePrivateKey, "line1\nline2");
  assert.equal(JSON.stringify(toPublicSettingsResponse(resolved, stored)).includes("line1"), false);
  assert.equal(toPublicSettingsResponse(resolved, stored).secrets.googlePrivateKey, true);
});
