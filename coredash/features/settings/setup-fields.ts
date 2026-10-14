export const SETUP_GROUPS = [
  {
    id: "location",
    title: "Location",
    description: "Required for weather and local time. Weather uses Open-Meteo and does not need an API key. City is optional; leave it blank to look the place up from the coordinates.",
    optional: false,
  },
  {
    id: "news",
    title: "News",
    description: "Optional. Mediastack fills the news card. SerpAPI fills Google News headlines.",
    optional: true,
  },
  {
    id: "stocks",
    title: "Stocks",
    description: "Optional. A brapi.dev token fills the stocks card.",
    optional: true,
  },
  {
    id: "calendar",
    title: "Google Calendar",
    description: "Optional. Save the service account email, private key, and at least one calendar ID together, or leave all of them empty.",
    optional: true,
  },
  {
    id: "gmail",
    title: "Gmail",
    description: "Optional. Save the OAuth client ID, client secret, and refresh token together, or leave all of them empty.",
    optional: true,
  },
] as const;

export type SetupGroupId = (typeof SETUP_GROUPS)[number]["id"];

export type SetupFieldKey =
  | "timezone"
  | "latitude"
  | "longitude"
  | "city"
  | "newsApiKey"
  | "serpApiKey"
  | "brapiToken"
  | "googleClientEmail"
  | "googlePrivateKey"
  | "calendarIds"
  | "gmailClientId"
  | "gmailClientSecret"
  | "gmailRefreshToken";

export type SetupInputKind = "text" | "number" | "textarea" | "secret" | "secret-textarea" | "list";

export interface SetupField {
  key: SetupFieldKey;
  label: string;
  env: string;
  group: SetupGroupId;
  required: boolean;
  secret: boolean;
  input: SetupInputKind;
  help: string;
  placeholder?: string;
}

export const SETUP_FIELDS: readonly SetupField[] = [
  {
    key: "timezone",
    label: "Timezone",
    env: "TZ",
    group: "location",
    required: true,
    secret: false,
    input: "text",
    help: "IANA timezone used for dates, weather, and calendars.",
    placeholder: "America/Sao_Paulo",
  },
  {
    key: "latitude",
    label: "Latitude",
    env: "LATITUDE",
    group: "location",
    required: true,
    secret: false,
    input: "number",
    help: "Between −90 and 90.",
    placeholder: "-23.5505",
  },
  {
    key: "longitude",
    label: "Longitude",
    env: "LONGITUDE",
    group: "location",
    required: true,
    secret: false,
    input: "number",
    help: "Between −180 and 180.",
    placeholder: "-46.6333",
  },
  {
    key: "city",
    label: "City",
    env: "CITY",
    group: "location",
    required: false,
    secret: false,
    input: "text",
    help: "Optional display name. Blank uses OpenStreetMap reverse geocoding.",
    placeholder: "São Paulo",
  },
  {
    key: "newsApiKey",
    label: "Mediastack key",
    env: "NEWS_API_KEY",
    group: "news",
    required: false,
    secret: true,
    input: "secret",
    help: "Optional access key for the Mediastack news fallback.",
  },
  {
    key: "serpApiKey",
    label: "SerpAPI key",
    env: "SERPAPI_KEY",
    group: "news",
    required: false,
    secret: true,
    input: "secret",
    help: "Optional SerpAPI key for Google News headlines.",
  },
  {
    key: "brapiToken",
    label: "brapi token",
    env: "BRAPI_TOKEN",
    group: "stocks",
    required: false,
    secret: true,
    input: "secret",
    help: "Optional token from brapi.dev.",
  },
  {
    key: "googleClientEmail",
    label: "Service account email",
    env: "GOOGLE_CLIENT_EMAIL",
    group: "calendar",
    required: false,
    secret: false,
    input: "text",
    help: "Google service account client email.",
    placeholder: "calendar@project.iam.gserviceaccount.com",
  },
  {
    key: "googlePrivateKey",
    label: "Service account private key",
    env: "GOOGLE_PRIVATE_KEY",
    group: "calendar",
    required: false,
    secret: true,
    input: "secret-textarea",
    help: "PEM private key. Newlines can be written as \\n.",
  },
  {
    key: "calendarIds",
    label: "Calendar IDs",
    env: "GOOGLE_CALENDAR_IDS",
    group: "calendar",
    required: false,
    secret: false,
    input: "list",
    help: "One calendar ID per line, or separate them with semicolons.",
    placeholder: "you@gmail.com",
  },
  {
    key: "gmailClientId",
    label: "OAuth client ID",
    env: "GOOGLE_GMAIL_CLIENT_ID",
    group: "gmail",
    required: false,
    secret: false,
    input: "text",
    help: "Google OAuth client ID for Gmail.",
  },
  {
    key: "gmailClientSecret",
    label: "OAuth client secret",
    env: "GOOGLE_GMAIL_CLIENT_SECRET",
    group: "gmail",
    required: false,
    secret: true,
    input: "secret",
    help: "Google OAuth client secret for Gmail.",
  },
  {
    key: "gmailRefreshToken",
    label: "Refresh token",
    env: "GOOGLE_GMAIL_REFRESH_TOKEN",
    group: "gmail",
    required: false,
    secret: true,
    input: "secret",
    help: "OAuth refresh token. scripts/get-gmail-token.ts can mint one.",
  },
];

export const SETUP_FIELD_KEYS = SETUP_FIELDS.map((field) => field.key);

export const SECRET_FIELD_KEYS = SETUP_FIELDS.filter((field) => field.secret).map((field) => field.key);

export const PUBLIC_FIELD_KEYS = SETUP_FIELDS.filter((field) => !field.secret).map((field) => field.key);
