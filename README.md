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

Copy `coredash/.env.example` to `coredash/.env` and configure only the integrations you use. The default single-host setup uses SQLite in the persistent `/data` volume. For a local Docker deployment, use `docker compose -f docker-compose.local.yml up -d --build`. When Ollama runs on the host, set `OLLAMA_URL=http://host.docker.internal:11434` in `coredash/.env`; native Node runs can keep `http://localhost:11434`.

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
