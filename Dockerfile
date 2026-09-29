FROM node:26-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM deps AS builder
COPY . .
RUN npm run build
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/data
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server.js"]
