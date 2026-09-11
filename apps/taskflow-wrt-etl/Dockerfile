# Stage 1: Build the submission-grading worker
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.0.0

# Copy root workspace configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/package.json ./packages/
COPY apps/taskflow-wrt-etl/package.json ./apps/taskflow-wrt-etl/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages ./packages
COPY apps/taskflow-wrt-etl ./apps/taskflow-wrt-etl

# Build shared package and worker
RUN pnpm --filter @taskflow/shared run build
RUN pnpm --filter taskflow-wrt-etl run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/taskflow-wrt-etl/package.json ./apps/taskflow-wrt-etl/
COPY --from=builder /app/apps/taskflow-wrt-etl/dist ./apps/taskflow-wrt-etl/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/taskflow-wrt-etl/node_modules ./apps/taskflow-wrt-etl/node_modules

CMD ["node", "apps/taskflow-wrt-etl/dist/main"]
