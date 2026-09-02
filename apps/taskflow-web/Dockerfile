# Stage 1: Build Next.js Web App
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.0.0

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/taskflow-web/package.json ./apps/taskflow-web/

RUN pnpm install --frozen-lockfile

COPY apps/taskflow-web ./apps/taskflow-web

RUN pnpm --filter taskflow-web run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/taskflow-web/public ./apps/taskflow-web/public
COPY --from=builder /app/apps/taskflow-web/.next/standalone ./
COPY --from=builder /app/apps/taskflow-web/.next/static ./apps/taskflow-web/.next/static

EXPOSE 3000

CMD ["node", "apps/taskflow-web/server.js"]
