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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=base --chown=nextjs:nodejs /app/.next ./.next
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=base --chown=nextjs:nodejs /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=base --chown=nextjs:nodejs /app/drizzle.config.json ./drizzle.config.json
COPY --from=base --chown=nextjs:nodejs /app/src/db ./src/db

# Create uploads directory
RUN mkdir -p public/uploads && chown nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
