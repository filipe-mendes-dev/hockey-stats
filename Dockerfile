FROM node:24-bookworm-slim AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

# Server modules validate configuration during the build. These values are disposable.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/benchline_build \
    BETTER_AUTH_SECRET=build-only-configuration-not-a-runtime-secret \
    BETTER_AUTH_URL=http://localhost:3000 \
    npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Keep the existing migration and interactive account commands in this same image.
COPY --from=build --chown=node:node /app ./

USER node

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
