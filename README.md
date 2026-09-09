<p align="left">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&pause=2000&color=6366F1&vCenter=true&width=260&height=48&lines=CoreDash" alt="CoreDash" />
</p>

CoreDash is a lightweight, self-hosted personal dashboard for personal automation, system monitoring, habit tracking, and home-lab workflows.

## Getting started

Run the published container:

```bash
docker run -d \
  -p 3000:3000 \
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

Configure the environment variables from `coredash/.env.example` before deploying integrations such as Google, Spotify, stocks, news, and the database.

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

The dashboard AI assistant uses `/api/ai/chat`, which streams responses through the configured server-side Ollama provider. Set `OLLAMA_URL` and `AI_MODEL` when using a non-default Ollama installation or model. The narrative endpoint also uses the server-side AI integration.

## Deployment

CoreDash is designed for Docker-based deployment on low-cost or home-lab hardware:

1. Pull the image or build the project locally.
2. Configure `.env` using `coredash/.env.example`.
3. Provide database credentials and any optional provider credentials.
4. Deploy and access the dashboard through the configured host and port.
