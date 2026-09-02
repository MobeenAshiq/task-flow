# Stage 1: Build NestJS REST API
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy root workspace configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/package.json ./packages/
COPY apps/taskflow-restapi/package.json ./apps/taskflow-restapi/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages ./packages
COPY apps/taskflow-restapi ./apps/taskflow-restapi

# Build shared package and restapi
RUN pnpm --filter @taskflow/shared run build || true
RUN pnpm --filter taskflow-restapi run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/taskflow-restapi/package.json ./apps/taskflow-restapi/
COPY --from=builder /app/apps/taskflow-restapi/dist ./apps/taskflow-restapi/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/taskflow-restapi/node_modules ./apps/taskflow-restapi/node_modules

EXPOSE 4000

CMD ["node", "apps/taskflow-restapi/dist/main"]
