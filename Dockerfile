FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./

RUN corepack enable \
  && pnpm install

COPY src ./src

RUN pnpm build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist

RUN corepack enable \
  && pnpm install --prod

EXPOSE 3000

CMD ["node", "dist/index.js"]
