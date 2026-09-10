import cron from "node-cron";
import type { DataSource } from "typeorm";

import { AI, AMAZON_WISHLIST, DB, GOOGLE, LOCATION } from "@/config/config";
import type {
  RuntimeSettings,
  RuntimeSettingsPatch,
  RuntimeSettingsResponse,
  RuntimeSettingsSources,
} from "@/features/settings/types";

const SETTINGS_ID = 1;
let settingsTablePromise: Promise<DataSource> | null = null;

interface RuntimeSettingsRow {
  timezone: string | null;
  latitude: string | null;
  longitude: string | null;
  cron_schedule: string | null;
  ai_model: string | null;
  calendar_ids: string | null;
}

const SETTING_KEYS = [
  "timezone",
  "latitude",
  "longitude",
  "cronSchedule",
  "aiModel",
  "calendarIds",
] as const;

function environmentDefaults(): RuntimeSettings {
  return {
    timezone: LOCATION.timezone,
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    cronSchedule: AMAZON_WISHLIST.cronSchedule,
    aiModel: AI.model,
    calendarIds: GOOGLE.calendarIds,
  };
}

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStored(value: string | null | undefined): value is string {
  return typeof value === "string";
}

function parseCalendarIds(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(/[;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function validTimezone(value: string): boolean {
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

export function validateRuntimeSettingsPatch(input: unknown): RuntimeSettingsPatch {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Settings payload must be an object");
  }

  const candidate = input as Record<string, unknown>;
  for (const key of Object.keys(candidate)) {
    if (!SETTING_KEYS.includes(key as (typeof SETTING_KEYS)[number])) {
      throw new Error(`Unknown setting: ${key}`);
    }
  }

  const patch: RuntimeSettingsPatch = {};
  for (const key of ["timezone", "latitude", "longitude", "cronSchedule", "aiModel"] as const) {
    if (!(key in candidate)) continue;
    const value = candidate[key];
    assertString(value, key);
    if (value === null) {
      patch[key] = null;
      continue;
    }

    const normalized = value.trim();
    if (key === "timezone" && (!normalized || !validTimezone(normalized))) {
      throw new Error("timezone must be a valid IANA timezone");
    }
    if (key === "latitude") {
      const number = Number(normalized);
      if (!normalized || !Number.isFinite(number) || number < -90 || number > 90) {
        throw new Error("latitude must be a number between -90 and 90");
      }
    }
    if (key === "longitude") {
      const number = Number(normalized);
      if (!normalized || !Number.isFinite(number) || number < -180 || number > 180) {
        throw new Error("longitude must be a number between -180 and 180");
      }
    }
    if (key === "cronSchedule" && normalized && (!cron.validate(normalized) || normalized.split(/\s+/).length !== 5)) {
      throw new Error("cronSchedule must be a valid five-field cron expression");
    }
    if (key === "aiModel" && (!normalized || normalized.length > 200)) {
      throw new Error("aiModel must be between 1 and 200 characters");
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

async function getSettingsDataSource() {
  if (!settingsTablePromise) {
    settingsTablePromise = (async () => {
      const { getDatabaseConnection } = await import("@/lib/db");
      const dataSource = await getDatabaseConnection();
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id ${DB.driver === "sqlite" ? "INTEGER PRIMARY KEY" : "INT NOT NULL PRIMARY KEY"},
          timezone VARCHAR(64) NULL,
          latitude VARCHAR(32) NULL,
          longitude VARCHAR(32) NULL,
          cron_schedule VARCHAR(100) NULL,
          ai_model VARCHAR(255) NULL,
          calendar_ids TEXT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      return dataSource;
    })().catch((error: unknown) => {
      settingsTablePromise = null;
      throw error;
    });
  }
  return settingsTablePromise;
}

function toResponse(row: RuntimeSettingsRow | undefined): RuntimeSettingsResponse {
  const defaults = environmentDefaults();
  const values = {
    timezone: hasValue(row?.timezone) ? row!.timezone : defaults.timezone,
    latitude: hasValue(row?.latitude) ? row!.latitude : defaults.latitude,
    longitude: hasValue(row?.longitude) ? row!.longitude : defaults.longitude,
    cronSchedule: hasValue(row?.cron_schedule) ? row!.cron_schedule : defaults.cronSchedule,
    aiModel: hasValue(row?.ai_model) ? row!.ai_model : defaults.aiModel,
    calendarIds: isStored(row?.calendar_ids) ? parseCalendarIds(row!.calendar_ids) : defaults.calendarIds,
  };

  const sources: RuntimeSettingsSources = {
    timezone: hasValue(row?.timezone) ? "database" : "environment",
    latitude: hasValue(row?.latitude) ? "database" : "environment",
    longitude: hasValue(row?.longitude) ? "database" : "environment",
    cronSchedule: hasValue(row?.cron_schedule) ? "database" : "environment",
    aiModel: hasValue(row?.ai_model) ? "database" : "environment",
    calendarIds: isStored(row?.calendar_ids) ? "database" : "environment",
  };

  return { settings: values, sources };
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsResponse> {
  const dataSource = await getSettingsDataSource();
  const rows = await dataSource.query("SELECT timezone, latitude, longitude, cron_schedule, ai_model, calendar_ids FROM app_settings WHERE id = ?", [SETTINGS_ID]) as RuntimeSettingsRow[];
  return toResponse(rows[0]);
}

export async function saveRuntimeSettings(patch: RuntimeSettingsPatch): Promise<RuntimeSettingsResponse> {
  const dataSource = await getSettingsDataSource();
  const currentRows = await dataSource.query("SELECT timezone, latitude, longitude, cron_schedule, ai_model, calendar_ids FROM app_settings WHERE id = ?", [SETTINGS_ID]) as RuntimeSettingsRow[];
  const current = currentRows[0];
  const values = {
    timezone: patch.timezone !== undefined ? patch.timezone : current?.timezone ?? null,
    latitude: patch.latitude !== undefined ? patch.latitude : current?.latitude ?? null,
    longitude: patch.longitude !== undefined ? patch.longitude : current?.longitude ?? null,
    cronSchedule: patch.cronSchedule !== undefined ? patch.cronSchedule : current?.cron_schedule ?? null,
    aiModel: patch.aiModel !== undefined ? patch.aiModel : current?.ai_model ?? null,
    calendarIds: patch.calendarIds !== undefined
      ? patch.calendarIds
      : current?.calendar_ids !== null && current?.calendar_ids !== undefined
        ? parseCalendarIds(current.calendar_ids)
        : null,
  };
  const parameters = [SETTINGS_ID, values.timezone, values.latitude, values.longitude, values.cronSchedule, values.aiModel, values.calendarIds === null ? null : values.calendarIds.join(";")];

  if (DB.driver === "sqlite") {
    await dataSource.query(`
      INSERT INTO app_settings (id, timezone, latitude, longitude, cron_schedule, ai_model, calendar_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET timezone=excluded.timezone, latitude=excluded.latitude,
        longitude=excluded.longitude, cron_schedule=excluded.cron_schedule, ai_model=excluded.ai_model,
        calendar_ids=excluded.calendar_ids, updated_at=CURRENT_TIMESTAMP
    `, parameters);
  } else {
    await dataSource.query(`
      INSERT INTO app_settings (id, timezone, latitude, longitude, cron_schedule, ai_model, calendar_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE timezone=VALUES(timezone), latitude=VALUES(latitude), longitude=VALUES(longitude),
        cron_schedule=VALUES(cron_schedule), ai_model=VALUES(ai_model), calendar_ids=VALUES(calendar_ids), updated_at=CURRENT_TIMESTAMP
    `, parameters);
  }

  return getRuntimeSettings();
}
