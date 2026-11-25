# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY DatingApp/package.json DatingApp/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY DatingApp/ ./
ENV EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_LIVE_ENABLED=true
RUN npm run build:web

FROM node:24-bookworm-slim AS runtime
WORKDIR /app/server
ENV NODE_ENV=production HEARTPULSE_WEB_DIR=/app/web
COPY --chown=node:node server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --chown=node:node server/*.mjs server/schema.sql ./
COPY --chown=node:node --from=frontend /app/frontend/dist /app/web
USER node
EXPOSE 3407
CMD ["node", "index.mjs"]
