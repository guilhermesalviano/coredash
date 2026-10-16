const isDev = process.env.NODE_ENV === "development";

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export type DatabaseDriver = "sqlite";

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export const EXTERNAL_SERVICES = {
  openMeteo: "https://api.open-meteo.com/v1/forecast",
  nominatim: "https://nominatim.openstreetmap.org/reverse",
  serpApi: "https://serpapi.com/search",
  brapi: "https://brapi.dev/api/quote",
  mediastack: "https://api.mediastack.com/v1/news",
} as const;

export const LOCATION = {
  latitude: optional("LATITUDE"),
  longitude: optional("LONGITUDE"),
  timezone: optional("TZ", defaultTimezone),
  city: optional("CITY"),
} as const;

export const UPDATE_INTERVAL_MS = 1 * 60 * 60 * 1000;

export const DB = {
  driver: "sqlite" as DatabaseDriver,
  sqlitePath: optional("SQLITE_PATH", "database.db"),
  synchronize: optional("DB_SYNCHRONIZE", "true") === "true",
} as const;

export const GOOGLE = {
  clientEmail: optional("GOOGLE_CLIENT_EMAIL"),
  privateKey: optional("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  calendarIds: optional("GOOGLE_CALENDAR_IDS").split(";").filter(Boolean),
  gmailClientId: optional("GOOGLE_GMAIL_CLIENT_ID"),
  gmailClientSecret: optional("GOOGLE_GMAIL_CLIENT_SECRET"),
  gmailRefreshToken: optional("GOOGLE_GMAIL_REFRESH_TOKEN"),
} as const;

export const APIS = {
  brapiToken: optional("BRAPI_TOKEN"),
  serpApiKey: optional("SERPAPI_KEY"),
  newsApiKey: optional("NEWS_API_KEY"),
} as const;

export const CONFIG = {
  isDev,
  logLevel: optional("LOG_LEVEL", isDev ? "debug" : "info"),
} as const;
