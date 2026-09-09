FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22-alpine AS runner

RUN apk add --no-cache tzdata \
  && addgroup --system --gid 1001 coredash \
  && adduser --system --uid 1001 coredash \
  && mkdir -p /data \
  && chown coredash:coredash /data

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    SQLITE_PATH=/data/database.db

COPY --from=builder --chown=coredash:coredash /app/public ./public
COPY --from=builder --chown=coredash:coredash /app/.next/standalone ./
COPY --from=builder --chown=coredash:coredash /app/.next/static ./.next/static

USER coredash
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
