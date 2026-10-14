import {
  SECRET_FIELD_KEYS,
  SETUP_FIELD_KEYS,
  type SetupFieldKey,
} from "@/features/settings/setup-fields";
import type {
  RuntimeSettings,
  RuntimeSettingsPatch,
  RuntimeSettingsResponse,
  RuntimeSettingsSources,
  SecretConfiguration,
  SecretFieldKey,
} from "@/features/settings/types";

export interface StoredSettings {
  timezone: string | null;
  latitude: string | null;
  longitude: string | null;
  city: string | null;
  calendarIds: string[] | null;
  googleClientEmail: string | null;
  gmailClientId: string | null;
  newsApiKey: string | null;
  serpApiKey: string | null;
  brapiToken: string | null;
  googlePrivateKey: string | null;
  gmailClientSecret: string | null;
  gmailRefreshToken: string | null;
}

export interface EnvironmentSettings {
  timezone: string;
  latitude: string;
  longitude: string;
  city: string;
  calendarIds: string[];
  googleClientEmail: string;
  gmailClientId: string;
  newsApiKey: string;
  serpApiKey: string;
  brapiToken: string;
  googlePrivateKey: string;
  gmailClientSecret: string;
  gmailRefreshToken: string;
}

export interface ResolvedRuntimeSettings extends RuntimeSettings {
  newsApiKey: string;
  serpApiKey: string;
  brapiToken: string;
  googlePrivateKey: string;
  gmailClientSecret: string;
  gmailRefreshToken: string;
}

const STRING_PATCH_KEYS = [
  "timezone",
  "latitude",
  "longitude",
  "city",
  "googleClientEmail",
  "gmailClientId",
  "newsApiKey",
  "serpApiKey",
  "brapiToken",
  "googlePrivateKey",
  "gmailClientSecret",
  "gmailRefreshToken",
] as const;

const REQUIRED_PUBLIC = ["timezone", "latitude", "longitude"] as const;

const INTEGRATION_GROUPS: Array<{ name: string; keys: SetupFieldKey[]; label: string }> = [
  {
    name: "calendar",
    keys: ["googleClientEmail", "googlePrivateKey", "calendarIds"],
    label: "Google Calendar credentials must be configured together (service account email, private key, and at least one calendar ID).",
  },
  {
    name: "gmail",
    keys: ["gmailClientId", "gmailClientSecret", "gmailRefreshToken"],
    label: "Gmail credentials must be configured together (client id, client secret, and refresh token).",
  },
];

export function emptyStoredSettings(): StoredSettings {
  return {
    timezone: null,
    latitude: null,
    longitude: null,
    city: null,
    calendarIds: null,
    googleClientEmail: null,
    gmailClientId: null,
    newsApiKey: null,
    serpApiKey: null,
    brapiToken: null,
    googlePrivateKey: null,
    gmailClientSecret: null,
    gmailRefreshToken: null,
  };
}

export function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function assertString(value: unknown, field: string): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new Error(`${field} must be a string or null`);
  }
}

function limited(value: string, field: string, max: number): string {
  if (value.length > max) {
    throw new Error(`${field} must be ${max} characters or less`);
  }
  return value;
}

export function validateRuntimeSettingsPatch(input: unknown): RuntimeSettingsPatch {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Settings payload must be an object");
  }

  const candidate = input as Record<string, unknown>;
  for (const key of Object.keys(candidate)) {
    if (!SETUP_FIELD_KEYS.includes(key as SetupFieldKey)) {
      throw new Error(`Unknown setting: ${key}`);
    }
  }

  const patch: RuntimeSettingsPatch = {};
  for (const key of STRING_PATCH_KEYS) {
    if (!(key in candidate)) continue;
    const value = candidate[key];
    assertString(value, key);
    if (value === null) {
      patch[key] = null;
      continue;
    }

    const normalized = key === "googlePrivateKey" ? normalizePrivateKey(value) : value.trim();
    if (SECRET_FIELD_KEYS.includes(key as SecretFieldKey) && !normalized) {
      continue;
    }
    if ((REQUIRED_PUBLIC as readonly string[]).includes(key) && !normalized) {
      throw new Error(`${key} must be configured`);
    }
    if (key === "timezone" && !validTimezone(normalized)) {
      throw new Error("timezone must be a valid IANA timezone");
    }
    if (key === "latitude") {
      const number = Number(normalized);
      if (!Number.isFinite(number) || number < -90 || number > 90) {
        throw new Error("latitude must be a number between -90 and 90");
      }
    }
    if (key === "longitude") {
      const number = Number(normalized);
      if (!Number.isFinite(number) || number < -180 || number > 180) {
        throw new Error("longitude must be a number between -180 and 180");
      }
    }
    if (key === "city") limited(normalized, "city", 120);
    if (key === "googleClientEmail" || key === "gmailClientId") {
      limited(normalized, key, 255);
    }
    if (key === "googlePrivateKey") limited(normalized, key, 8000);
    if (SECRET_FIELD_KEYS.includes(key as SecretFieldKey) && key !== "googlePrivateKey") {
      limited(normalized, key, 2000);
    }
    patch[key] = normalized || null;
  }

  if ("calendarIds" in candidate) {
    const value = candidate.calendarIds;
    if (value !== null && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
      throw new Error("calendarIds must be an array of strings or null");
    }
    const normalized = value === null ? null : [...new Set(value.map((item) => item.trim()).filter(Boolean))];
    if (normalized && normalized.some((item) => item.length > 255)) {
      throw new Error("calendarIds entries must be 255 characters or less");
    }
    patch.calendarIds = normalized;
  }

  return patch;
}

export function applySettingsPatch(stored: StoredSettings, patch: RuntimeSettingsPatch): StoredSettings {
  const next: StoredSettings = { ...stored };
  for (const key of STRING_PATCH_KEYS) {
    if (patch[key] !== undefined) next[key] = patch[key] ?? null;
  }
  if (patch.calendarIds !== undefined) next.calendarIds = patch.calendarIds;
  return next;
}

function pickText(stored: string | null, env: string): string {
  return hasText(stored) ? stored.trim() : env.trim();
}

export function resolveSettings(stored: StoredSettings, env: EnvironmentSettings): ResolvedRuntimeSettings {
  return {
    timezone: pickText(stored.timezone, env.timezone),
    latitude: pickText(stored.latitude, env.latitude),
    longitude: pickText(stored.longitude, env.longitude),
    city: pickText(stored.city, env.city),
    calendarIds: stored.calendarIds ?? env.calendarIds,
    googleClientEmail: pickText(stored.googleClientEmail, env.googleClientEmail),
    gmailClientId: pickText(stored.gmailClientId, env.gmailClientId),
    newsApiKey: pickText(stored.newsApiKey, env.newsApiKey),
    serpApiKey: pickText(stored.serpApiKey, env.serpApiKey),
    brapiToken: pickText(stored.brapiToken, env.brapiToken),
    googlePrivateKey: normalizePrivateKey(pickText(stored.googlePrivateKey, env.googlePrivateKey)),
    gmailClientSecret: pickText(stored.gmailClientSecret, env.gmailClientSecret),
    gmailRefreshToken: pickText(stored.gmailRefreshToken, env.gmailRefreshToken),
  };
}

function present(resolved: ResolvedRuntimeSettings, key: SetupFieldKey): boolean {
  if (key === "calendarIds") return resolved.calendarIds.length > 0;
  return hasText(resolved[key]);
}

export function missingRequiredSettings(resolved: ResolvedRuntimeSettings): SetupFieldKey[] {
  const missing: SetupFieldKey[] = [];
  if (!hasText(resolved.timezone) || !validTimezone(resolved.timezone)) missing.push("timezone");
  const latitude = Number(resolved.latitude);
  if (!hasText(resolved.latitude) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) missing.push("latitude");
  const longitude = Number(resolved.longitude);
  if (!hasText(resolved.longitude) || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) missing.push("longitude");
  return missing;
}

export function assertResolvedSettings(patch: RuntimeSettingsPatch, resolved: ResolvedRuntimeSettings): void {
  const missing = missingRequiredSettings(resolved);
  if (missing.length > 0) {
    throw new Error(`${missing.join(", ")} must be configured`);
  }

  for (const group of INTEGRATION_GROUPS) {
    const touched = group.keys.some((key) => key in patch);
    if (!touched) continue;
    const filled = group.keys.filter((key) => present(resolved, key));
    if (filled.length > 0 && filled.length < group.keys.length) {
      throw new Error(group.label);
    }
  }
}

function sourceFor(stored: string | null | string[] | undefined): "database" | "environment" {
  if (Array.isArray(stored)) return "database";
  return hasText(stored) ? "database" : "environment";
}

export function toPublicSettingsResponse(resolved: ResolvedRuntimeSettings, stored: StoredSettings): RuntimeSettingsResponse {
  const settings: RuntimeSettings = {
    timezone: resolved.timezone,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    city: resolved.city,
    calendarIds: resolved.calendarIds,
    googleClientEmail: resolved.googleClientEmail,
    gmailClientId: resolved.gmailClientId,
  };
  const sources: RuntimeSettingsSources = {
    timezone: sourceFor(stored.timezone),
    latitude: sourceFor(stored.latitude),
    longitude: sourceFor(stored.longitude),
    city: sourceFor(stored.city),
    calendarIds: stored.calendarIds === null ? "environment" : "database",
    googleClientEmail: sourceFor(stored.googleClientEmail),
    gmailClientId: sourceFor(stored.gmailClientId),
  };
  const secrets = Object.fromEntries(
    SECRET_FIELD_KEYS.map((key) => {
      const value = resolved[key];
      return [key, typeof value === "string" && hasText(value)];
    }),
  ) as SecretConfiguration;

  return {
    settings,
    sources,
    secrets,
    setupRequired: missingRequiredSettings(resolved).length > 0,
  };
}
