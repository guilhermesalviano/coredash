<p align="left">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&pause=2000&color=6366F1&vCenter=true&width=260&height=48&lines=CoreDash" alt="CoreDash" />
</p>

CoreDash is a lightweight, self-hosted personal dashboard for personal automation, system monitoring, habit tracking, and home-lab workflows.

## Getting started

Prerequisites:

- Node.js LTS

Copy `.env.example` to `.env` (optional) and start the application:

```bash
npm install
npm run dev
```

For production mode, use `npm start`. It starts the standalone server and builds it automatically on the first run when needed:

```bash
npm start
```

Persistence uses a local SQLite database (`database.db` by default, configurable via `SQLITE_PATH`). On a fresh install without configured coordinates, the first-run setup screen opens automatically so you can set your timezone, detect your coordinates with **Use my location**, and optionally configure API keys.

Useful checks:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Architecture

The application uses incremental feature-oriented boundaries:

```text
.
├── app/                 # Pages and thin API route adapters
├── features/            # Feature contracts and server/application logic
│   ├── dashboard/
│   ├── focus/
│   ├── news/
│   ├── settings/
│   ├── todos/
│   └── weather/
├── components/          # Shared UI and dashboard cards
├── services/            # External API/provider adapters
├── entities/            # TypeORM SQLite entities
├── lib/                 # Shared infrastructure and API helpers
├── types/               # Compatibility and cross-feature contracts
└── android/             # Native Kotlin Android app
```

API routes preserve the existing endpoint paths and response envelopes. Weather, News, Settings, and Todo business logic lives in their feature server modules rather than inside route handlers.

### Setup fields

The first-run screen appears when the timezone, latitude, or longitude is missing or invalid. You can fill your coordinates manually or click **Use my location** to populate your browser coordinates, timezone, and reverse-geocoded city. The same form is available later under Settings → Application. Values are stored in the SQLite `app_settings` table and override the environment. The field list lives in `features/settings/setup-fields.ts`.

| Field | Environment variable | Required | Secret |
| --- | --- | --- | --- |
| Timezone | `TZ` | yes | no |
| Latitude | `LATITUDE` | yes | no |
| Longitude | `LONGITUDE` | yes | no |
| City | `CITY` | no | no |
| Mediastack key | `NEWS_API_KEY` | no | yes |
| SerpAPI key | `SERPAPI_KEY` | no | yes |
| brapi token | `BRAPI_TOKEN` | no | yes |
| Google service account email | `GOOGLE_CLIENT_EMAIL` | no | no |
| Google service account private key | `GOOGLE_PRIVATE_KEY` | no | yes |
| Calendar IDs | `GOOGLE_CALENDAR_IDS` | no | no |
| Gmail OAuth client ID | `GOOGLE_GMAIL_CLIENT_ID` | no | no |
| Gmail OAuth client secret | `GOOGLE_GMAIL_CLIENT_SECRET` | no | yes |
| Gmail refresh token | `GOOGLE_GMAIL_REFRESH_TOKEN` | no | yes |

Weather uses Open-Meteo and does not need an API key. Optional groups are all-or-nothing when you edit them: Calendar needs the email, private key, and at least one calendar ID together; Gmail needs the client ID, client secret, and refresh token together. A blank secret field keeps the value already stored.
