FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install dependencies for drizzle-kit and seed
RUN npm ci --omit=dev

# Copy built app
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/drizzle.config.json ./drizzle.config.json
COPY --from=base /app/src/db ./src/db
COPY --from=base /app/tsconfig.json ./tsconfig.json

# Create uploads directory
RUN mkdir -p public/uploads

EXPOSE 3000

# Railway usa isso automaticamente
CMD ["npm", "start"]
