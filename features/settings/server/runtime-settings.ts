import type { DataSource } from "typeorm";

import { APIS, CAMERA, GOOGLE, LOCATION } from "@/config/config";
import type { RuntimeSettingsPatch, RuntimeSettingsResponse } from "@/features/settings/types";
import {
  applySettingsPatch,
  assertResolvedSettings,
  emptyStoredSettings,
  resolveSettings,
  toPublicSettingsResponse,
  validateRuntimeSettingsPatch,
  type EnvironmentSettings,
  type ResolvedRuntimeSettings,
  type StoredSettings,
} from "@/features/settings/server/setup-validation";
import { globalSingleton } from "@/lib/global-singleton";
import { fetchNominatimAPI } from "@/services/nominatim-api";
import { isErrorResponse } from "@/utils/check-service-error";

const SETTINGS_ID = 1;

// Shared by the page and every route bundle, so the table is prepared once and
// the settings row is read once until it is saved again.
const state = globalSingleton("runtimeSettings", () => ({
  tablePromise: null as Promise<DataSource> | null,
  storedPromise: null as Promise<StoredSettings> | null,
}));

interface RuntimeSettingsRow {
  timezone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  calendar_ids?: string | null;
  city?: string | null;
  news_api_key?: string | null;
  brapi_token?: string | null;
  serpapi_key?: string | null;
  google_client_email?: string | null;
  google_private_key?: string | null;
  gmail_client_id?: string | null;
  gmail_client_secret?: string | null;
  gmail_refresh_token?: string | null;
  camera_url?: string | null;
}

const EXTRA_COLUMNS = [
  "city VARCHAR(120) NULL",
  "news_api_key TEXT NULL",
  "brapi_token TEXT NULL",
  "serpapi_key TEXT NULL",
  "google_client_email VARCHAR(255) NULL",
  "google_private_key TEXT NULL",
  "gmail_client_id TEXT NULL",
  "gmail_client_secret TEXT NULL",
  "gmail_refresh_token TEXT NULL",
  "camera_url TEXT NULL",
];

const SELECT_COLUMNS = [
  "timezone",
  "latitude",
  "longitude",
  "calendar_ids",
  "city",
  "news_api_key",
  "brapi_token",
  "serpapi_key",
  "google_client_email",
  "google_private_key",
  "gmail_client_id",
  "gmail_client_secret",
  "gmail_refresh_token",
  "camera_url",
].join(", ");

function environmentDefaults(): EnvironmentSettings {
  return {
    timezone: LOCATION.timezone,
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    city: LOCATION.city,
    calendarIds: GOOGLE.calendarIds,
    googleClientEmail: GOOGLE.clientEmail,
    googlePrivateKey: GOOGLE.privateKey,
    gmailClientId: GOOGLE.gmailClientId,
    gmailClientSecret: GOOGLE.gmailClientSecret,
    gmailRefreshToken: GOOGLE.gmailRefreshToken,
    newsApiKey: APIS.newsApiKey,
    serpApiKey: APIS.serpApiKey,
    brapiToken: APIS.brapiToken,
    cameraUrl: CAMERA.url,
  };
}

function isDuplicateColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate column/i.test(message);
}

function parseCalendarIds(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(/[;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function fromRow(row: RuntimeSettingsRow | undefined): StoredSettings {
  if (!row) return emptyStoredSettings();
  return {
    timezone: row.timezone ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    city: row.city ?? null,
    calendarIds: row.calendar_ids === null || row.calendar_ids === undefined ? null : parseCalendarIds(row.calendar_ids),
    googleClientEmail: row.google_client_email ?? null,
    gmailClientId: row.gmail_client_id ?? null,
    newsApiKey: row.news_api_key ?? null,
    serpApiKey: row.serpapi_key ?? null,
    brapiToken: row.brapi_token ?? null,
    googlePrivateKey: row.google_private_key ?? null,
    gmailClientSecret: row.gmail_client_secret ?? null,
    gmailRefreshToken: row.gmail_refresh_token ?? null,
    cameraUrl: row.camera_url ?? null,
  };
}

async function getSettingsDataSource() {
  if (!state.tablePromise) {
    state.tablePromise = (async () => {
      const { getDatabaseConnection } = await import("@/lib/db");
      const dataSource = await getDatabaseConnection();
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY,
          timezone VARCHAR(64) NULL,
          latitude VARCHAR(32) NULL,
          longitude VARCHAR(32) NULL,
          calendar_ids TEXT NULL,
          city VARCHAR(120) NULL,
          news_api_key TEXT NULL,
          brapi_token TEXT NULL,
          serpapi_key TEXT NULL,
          google_client_email VARCHAR(255) NULL,
          google_private_key TEXT NULL,
          gmail_client_id TEXT NULL,
          gmail_client_secret TEXT NULL,
          gmail_refresh_token TEXT NULL,
          camera_url TEXT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      for (const column of EXTRA_COLUMNS) {
        try {
          await dataSource.query(`ALTER TABLE app_settings ADD COLUMN ${column}`);
        } catch (error: unknown) {
          if (!isDuplicateColumn(error)) throw error;
        }
      }
      return dataSource;
    })().catch((error: unknown) => {
      state.tablePromise = null;
      throw error;
    });
  }
  return state.tablePromise;
}

async function loadStored(): Promise<StoredSettings> {
  const dataSource = await getSettingsDataSource();
  const rows = await dataSource.query(
    `SELECT ${SELECT_COLUMNS} FROM app_settings WHERE id = ?`,
    [SETTINGS_ID],
  ) as RuntimeSettingsRow[];
  return fromRow(rows[0]);
}

/**
 * Settings are read on every request, often several times, so the row is kept
 * in memory. This process is the only writer; saveRuntimeSettings drops the copy.
 */
function readStored(): Promise<StoredSettings> {
  if (!state.storedPromise) {
    const pending = loadStored().catch((error: unknown) => {
      if (state.storedPromise === pending) state.storedPromise = null;
      throw error;
    });
    state.storedPromise = pending;
  }
  return state.storedPromise;
}

export async function getResolvedRuntimeSettings(): Promise<ResolvedRuntimeSettings> {
  const stored = await readStored();
  return resolveSettings(stored, environmentDefaults());
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsResponse> {
  const stored = await readStored();
  const resolved = resolveSettings(stored, environmentDefaults());
  return toPublicSettingsResponse(resolved, stored);
}

function storedParameters(stored: StoredSettings): unknown[] {
  return [
    SETTINGS_ID,
    stored.timezone,
    stored.latitude,
    stored.longitude,
    stored.calendarIds === null ? null : stored.calendarIds.join(";"),
    stored.city,
    stored.newsApiKey,
    stored.brapiToken,
    stored.serpApiKey,
    stored.googleClientEmail,
    stored.googlePrivateKey,
    stored.gmailClientId,
    stored.gmailClientSecret,
    stored.gmailRefreshToken,
    stored.cameraUrl,
  ];
}

export async function saveRuntimeSettings(
  patch: RuntimeSettingsPatch,
): Promise<RuntimeSettingsResponse> {
  const dataSource = await getSettingsDataSource();
  const current = await readStored();
  const next = applySettingsPatch(current, patch);
  assertResolvedSettings(patch, resolveSettings(next, environmentDefaults()));
  const parameters = storedParameters(next);
  const columns = [
    "id", "timezone", "latitude", "longitude", "calendar_ids", "city",
    "news_api_key", "brapi_token", "serpapi_key", "google_client_email",
    "google_private_key", "gmail_client_id", "gmail_client_secret", "gmail_refresh_token",
    "camera_url",
  ];
  const placeholders = columns.map(() => "?").join(", ");
  const assignments = columns.slice(1).map((column) => `${column}=excluded.${column}`).join(", ");

  await dataSource.query(`
    INSERT INTO app_settings (${columns.join(", ")})
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${assignments}, updated_at=CURRENT_TIMESTAMP
  `, parameters);
  state.storedPromise = null;

  return getRuntimeSettings();
}

export async function resolveCityFromCoordinates(
  latitude: string,
  longitude: string,
): Promise<string | null> {
  const lat = Number(latitude.trim());
  const lon = Number(longitude.trim());
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("latitude must be a number between -90 and 90");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("longitude must be a number between -180 and 180");
  }
  const response = await fetchNominatimAPI({
    latitude: String(lat),
    longitude: String(lon),
  });
  if (isErrorResponse(response)) return null;
  const address = response.address;
  return address?.city || address?.municipality || address?.suburb || null;
}

export { validateRuntimeSettingsPatch };
