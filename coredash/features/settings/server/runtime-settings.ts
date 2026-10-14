import type { DataSource } from "typeorm";

import { AI, APIS, DB, GOOGLE, LOCATION, SPOTIFY } from "@/config/config";
import { readSpotifyRefreshToken } from "@/utils/spotify-token-store";
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

const SETTINGS_ID = 1;
let settingsTablePromise: Promise<DataSource> | null = null;

interface RuntimeSettingsRow {
  timezone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  ai_model?: string | null;
  calendar_ids?: string | null;
  city?: string | null;
  personal_context?: string | null;
  openrouter_api_key?: string | null;
  news_api_key?: string | null;
  brapi_token?: string | null;
  serpapi_key?: string | null;
  google_client_email?: string | null;
  google_private_key?: string | null;
  gmail_client_id?: string | null;
  gmail_client_secret?: string | null;
  gmail_refresh_token?: string | null;
  spotify_client_id?: string | null;
  spotify_client_secret?: string | null;
  spotify_refresh_token?: string | null;
}

const EXTRA_COLUMNS = [
  "city VARCHAR(120) NULL",
  "personal_context TEXT NULL",
  "openrouter_api_key TEXT NULL",
  "news_api_key TEXT NULL",
  "brapi_token TEXT NULL",
  "serpapi_key TEXT NULL",
  "google_client_email VARCHAR(255) NULL",
  "google_private_key TEXT NULL",
  "gmail_client_id TEXT NULL",
  "gmail_client_secret TEXT NULL",
  "gmail_refresh_token TEXT NULL",
  "spotify_client_id TEXT NULL",
  "spotify_client_secret TEXT NULL",
  "spotify_refresh_token TEXT NULL",
];

const SELECT_COLUMNS = [
  "timezone",
  "latitude",
  "longitude",
  "ai_model",
  "calendar_ids",
  "city",
  "personal_context",
  "openrouter_api_key",
  "news_api_key",
  "brapi_token",
  "serpapi_key",
  "google_client_email",
  "google_private_key",
  "gmail_client_id",
  "gmail_client_secret",
  "gmail_refresh_token",
  "spotify_client_id",
  "spotify_client_secret",
  "spotify_refresh_token",
].join(", ");

function environmentDefaults(): EnvironmentSettings {
  return {
    timezone: LOCATION.timezone,
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    city: LOCATION.city,
    aiModel: AI.model,
    personalContext: AI.personalContext,
    calendarIds: GOOGLE.calendarIds,
    googleClientEmail: GOOGLE.clientEmail,
    googlePrivateKey: GOOGLE.privateKey,
    gmailClientId: GOOGLE.gmailClientId,
    gmailClientSecret: GOOGLE.gmailClientSecret,
    gmailRefreshToken: GOOGLE.gmailRefreshToken,
    spotifyClientId: SPOTIFY.clientId,
    spotifyClientSecret: SPOTIFY.clientSecret,
    spotifyRefreshToken: SPOTIFY.refreshToken,
    openRouterApiKey: AI.openRouterApiKey,
    newsApiKey: APIS.newsApiKey,
    serpApiKey: APIS.serpApiKey,
    brapiToken: APIS.brapiToken,
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
    aiModel: row.ai_model ?? null,
    personalContext: row.personal_context ?? null,
    calendarIds: row.calendar_ids === null || row.calendar_ids === undefined ? null : parseCalendarIds(row.calendar_ids),
    googleClientEmail: row.google_client_email ?? null,
    gmailClientId: row.gmail_client_id ?? null,
    spotifyClientId: row.spotify_client_id ?? null,
    openRouterApiKey: row.openrouter_api_key ?? null,
    newsApiKey: row.news_api_key ?? null,
    serpApiKey: row.serpapi_key ?? null,
    brapiToken: row.brapi_token ?? null,
    googlePrivateKey: row.google_private_key ?? null,
    gmailClientSecret: row.gmail_client_secret ?? null,
    gmailRefreshToken: row.gmail_refresh_token ?? null,
    spotifyClientSecret: row.spotify_client_secret ?? null,
    spotifyRefreshToken: row.spotify_refresh_token ?? null,
  };
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
          ai_model VARCHAR(255) NULL,
          calendar_ids TEXT NULL,
          city VARCHAR(120) NULL,
          personal_context TEXT NULL,
          openrouter_api_key TEXT NULL,
          news_api_key TEXT NULL,
          brapi_token TEXT NULL,
          serpapi_key TEXT NULL,
          google_client_email VARCHAR(255) NULL,
          google_private_key TEXT NULL,
          gmail_client_id TEXT NULL,
          gmail_client_secret TEXT NULL,
          gmail_refresh_token TEXT NULL,
          spotify_client_id TEXT NULL,
          spotify_client_secret TEXT NULL,
          spotify_refresh_token TEXT NULL,
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
      settingsTablePromise = null;
      throw error;
    });
  }
  return settingsTablePromise;
}

async function readStored(): Promise<StoredSettings> {
  const dataSource = await getSettingsDataSource();
  const rows = await dataSource.query(
    `SELECT ${SELECT_COLUMNS} FROM app_settings WHERE id = ?`,
    [SETTINGS_ID],
  ) as RuntimeSettingsRow[];
  return fromRow(rows[0]);
}

function environmentWithSpotifyFile(): EnvironmentSettings {
  const env = environmentDefaults();
  if (!env.spotifyRefreshToken.trim()) {
    const fileToken = readSpotifyRefreshToken();
    if (fileToken) env.spotifyRefreshToken = fileToken;
  }
  return env;
}

export async function getResolvedRuntimeSettings(): Promise<ResolvedRuntimeSettings> {
  const stored = await readStored();
  return resolveSettings(stored, environmentWithSpotifyFile());
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsResponse> {
  const stored = await readStored();
  const resolved = resolveSettings(stored, environmentWithSpotifyFile());
  return toPublicSettingsResponse(resolved, stored);
}

function storedParameters(stored: StoredSettings): unknown[] {
  return [
    SETTINGS_ID,
    stored.timezone,
    stored.latitude,
    stored.longitude,
    stored.aiModel,
    stored.calendarIds === null ? null : stored.calendarIds.join(";"),
    stored.city,
    stored.personalContext,
    stored.openRouterApiKey,
    stored.newsApiKey,
    stored.brapiToken,
    stored.serpApiKey,
    stored.googleClientEmail,
    stored.googlePrivateKey,
    stored.gmailClientId,
    stored.gmailClientSecret,
    stored.gmailRefreshToken,
    stored.spotifyClientId,
    stored.spotifyClientSecret,
    stored.spotifyRefreshToken,
  ];
}

export async function saveRuntimeSettings(
  patch: RuntimeSettingsPatch,
  options?: { skipSetupValidation?: boolean },
): Promise<RuntimeSettingsResponse> {
  const dataSource = await getSettingsDataSource();
  const current = await readStored();
  const next = applySettingsPatch(current, patch);
  if (!options?.skipSetupValidation) {
    assertResolvedSettings(patch, resolveSettings(next, environmentWithSpotifyFile()));
  }
  const parameters = storedParameters(next);
  const columns = [
    "id", "timezone", "latitude", "longitude", "ai_model", "calendar_ids", "city", "personal_context",
    "openrouter_api_key", "news_api_key", "brapi_token", "serpapi_key", "google_client_email",
    "google_private_key", "gmail_client_id", "gmail_client_secret", "gmail_refresh_token",
    "spotify_client_id", "spotify_client_secret", "spotify_refresh_token",
  ];
  const placeholders = columns.map(() => "?").join(", ");
  const assignments = columns.slice(1).map((column) => `${column}=excluded.${column}`).join(", ");
  const mariadbAssignments = columns.slice(1).map((column) => `${column}=VALUES(${column})`).join(", ");

  if (DB.driver === "sqlite") {
    await dataSource.query(`
      INSERT INTO app_settings (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${assignments}, updated_at=CURRENT_TIMESTAMP
    `, parameters);
  } else {
    await dataSource.query(`
      INSERT INTO app_settings (${columns.join(", ")})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${mariadbAssignments}, updated_at=CURRENT_TIMESTAMP
    `, parameters);
  }

  return getRuntimeSettings();
}

export { validateRuntimeSettingsPatch };
