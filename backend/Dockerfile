FROM node:22-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Prisma schema needed before generate
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3001

# On start: apply migrations, seed, then run the server
CMD npx prisma migrate deploy && npx prisma db seed && npx tsx src/index.ts