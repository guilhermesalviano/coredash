const isDev = process.env.NODE_ENV === "development";
const MOCK_BASE_URL = "http://localhost:1080";

function api(prod: string, path: string): string {
  return `${isDev ? MOCK_BASE_URL : prod}${path}`;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export type DatabaseDriver = "sqlite" | "mariadb";
const configuredDbDriver = optional("DB_DRIVER", process.env.DB_HOST ? "mariadb" : "sqlite");
const dbDriver: DatabaseDriver = configuredDbDriver === "mariadb" ? "mariadb" : "sqlite";

export const EXTERNAL_SERVICES = {
  openMeteo: api("https://api.open-meteo.com", "/v1/forecast"),
  nominatim: api("https://nominatim.openstreetmap.org", "/reverse"),
  serpApi: api("https://serpapi.com", "/search"),
  brapi: api("https://brapi.dev", "/api/quote"),
  mediastack: "https://api.mediastack.com/v1/news",
  ollama: optional("OLLAMA_URL", "http://localhost:11434"),
} as const;

export const LOCATION = {
  latitude: optional("LATITUDE", "-23.533773"),
  longitude: optional("LONGITUDE", "-46.625290"),
  timezone: optional("TZ", "America/Sao_Paulo"),
} as const;

export const UPDATE_INTERVAL_MS = 1 * 60 * 60 * 1000;

export const DB = {
  driver: dbDriver,
  host: optional("DB_HOST"),
  port: Number(optional("DB_PORT", "3306")),
  name: optional("DB_NAME", "coredash"),
  username: optional("DB_USER"),
  password: optional("DB_PASSWORD"),
  sqlitePath: optional("SQLITE_PATH", "database.db"),
  synchronize: optional("DB_SYNCHRONIZE", dbDriver === "sqlite" ? "true" : "false") === "true",
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
  geminiApiKey: optional("GEMINI_API_KEY"),
} as const;

export const SPOTIFY = {
  clientId: optional("SPOTIFY_CLIENT_ID"),
  clientSecret: optional("SPOTIFY_CLIENT_SECRET"),
  refreshToken: optional("SPOTIFY_REFRESH_TOKEN"),
} as const;

export const AI = {
  model: optional("AI_MODEL", "gemma4:e2b"),
  personalContext: optional("PERSONAL_CONTEXT"),
} as const;

export const AMAZON_WISHLIST = {
  id: optional("WISHLIST_ID"),
  cronSchedule: optional("CRON_SCHEDULE"),
} as const;

export const CONFIG = {
  isDev,
  logLevel: optional("LOG_LEVEL", isDev ? "debug" : "info"),
} as const;
