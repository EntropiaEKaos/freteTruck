FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/drizzle.config.json ./drizzle.config.json
COPY --from=base /app/src/db ./src/db
COPY --from=base /app/tsconfig.json ./tsconfig.json

RUN mkdir -p public/uploads
RUN chmod +x ./scripts/start-with-migrations.sh

EXPOSE 3000

# Auto-aplica migrations + seed + start
CMD ["sh", "./scripts/start-with-migrations.sh"]
