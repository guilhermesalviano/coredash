<p align="left">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&pause=2000&color=6366F1&vCenter=true&width=260&height=48&lines=CoreDash" alt="CoreDash" />
</p>

CoreDash is a lightweight, self-hosted personal dashboard for personal automation, system monitoring, habit tracking, and home-lab workflows.

## Getting started

Run the published container:

```bash
docker run -d \
  --env-file coredash/.env \
  -p 127.0.0.1:3000:3000 \
  -v coredash-data:/data \
  --name coredash \
  guilhermesalviano/coredash:latest
```

Or use Docker Compose:

```yaml
services:
  coredash:
    image: guilhermesalviano/coredash:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
```

Copy `coredash/.env.example` to `coredash/.env` and configure only the integrations you use. The default single-host setup uses SQLite in the persistent `/data` volume. For a local Docker deployment, use `docker compose -f docker-compose.local.yml up -d --build`. Chat and the daily narrative call OpenRouter, so set `OPENROUTER_API_KEY` (and optionally `AI_MODEL`) before the assistant can answer. If that key is missing, the first-run setup screen collects it.

## Development

Prerequisites:

- Node.js LTS
- Docker and Docker Compose

Start the application:

```bash
cd coredash
npm install
npm run dev
```

For production mode, use `npm start`. It starts the standalone server and builds it automatically on the first run when needed:

```bash
cd coredash
npm start
```

Start the mock external services from the repository root:

```bash
docker compose up --build
```

Useful checks:

```bash
cd coredash
npx tsc --noEmit
npm run lint
npm run build
```

## Architecture

The application uses incremental feature-oriented boundaries:

```text
coredash/
├── app/                 # Pages and thin API route adapters
├── features/            # Feature contracts and server/application logic
│   ├── ai/
│   ├── dashboard/
│   ├── news/
│   ├── todos/
│   └── weather/
├── components/          # Shared UI and dashboard cards
├── services/            # External API/provider adapters
├── entities/            # TypeORM entities
├── lib/                 # Shared infrastructure and API helpers
└── types/               # Compatibility and cross-feature contracts
```

API routes preserve the existing endpoint paths and response envelopes. Weather, News, and Todo business logic now lives in their feature server modules rather than inside route handlers.

The dashboard AI assistant uses `/api/ai/chat`, which streams responses through the server-side OpenRouter provider (`lib/ai/providers/openrouter.ts`). The narrative endpoint uses the same provider. Set `OPENROUTER_API_KEY` and, when you want a model other than `openai/gpt-4o-mini`, `AI_MODEL`. Both can also be saved from the setup screen; the key stays on the server and is never returned to the browser.

### Setup fields

The first-run screen appears when the OpenRouter key, model, timezone, latitude, or longitude is missing or invalid. Location and the model have code defaults, so a fresh install usually only needs the API key. The same form is available later under Settings → Application. Values are stored in the `app_settings` table and override the environment. Database connection settings stay in the environment and are not on the form. The field list lives in `coredash/features/settings/setup-fields.ts`.

| Field | Environment variable | Required | Secret |
| --- | --- | --- | --- |
| OpenRouter API key | `OPENROUTER_API_KEY` | yes | yes |
| Model | `AI_MODEL` | yes | no |
| Personal context | `PERSONAL_CONTEXT` | no | no |
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
| Spotify client ID | `SPOTIFY_CLIENT_ID` | no | no |
| Spotify client secret | `SPOTIFY_CLIENT_SECRET` | no | yes |
| Spotify refresh token | `SPOTIFY_REFRESH_TOKEN` | no | yes |

Weather uses Open-Meteo and does not need an API key. Optional groups are all-or-nothing when you edit them: Calendar needs the email, private key, and at least one calendar ID together; Gmail needs the client ID, client secret, and refresh token together; Spotify needs the client ID and client secret together. The Spotify refresh token can be saved later from the Spotify card. A blank secret field keeps the value already stored.

### MCP server

CoreDash starts its MCP server together with the standard Next.js server at `http://localhost:3000/api/mcp`. Start CoreDash normally, then configure the MCP-compatible client with:

```json
{
  "mcpServers": {
    "coredash": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

The server exposes dashboard reads, todo and habit updates, Gmail actions, Spotify controls, and the CoreDash AI assistant. `npm run mcp` remains available when an MCP client specifically requires a stdio-launched server. Set `CORE_DASH_URL` when the MCP endpoint must call a CoreDash instance running at another address.

## Deployment

CoreDash is designed for Docker-based deployment on low-cost or home-lab hardware:

1. Pull the image or build the project locally.
2. Configure `.env` using `coredash/.env.example`.
3. Provide database credentials and any optional provider credentials.
4. Deploy and access the dashboard through the configured host and port.
