# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# 1. Copy package files และติดตั้ง dependencies
COPY package*.json ./
RUN npm ci

# 2. Copy prisma config และ folder prisma เข้ามาก่อน
COPY prisma.config.ts ./
COPY prisma ./prisma/

# 3. สร้าง Prisma Client (ขั้นตอนนี้สำคัญมากเพื่อแก้ Error TS2305)
RUN npx prisma generate

# 4. Copy ไฟล์ที่เหลือทั้งหมดและ Build โปรเจกต์
COPY . .
RUN npm run build

RUN npm prune --omit=dev

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy เฉพาะไฟล์ที่จำเป็นมาจาก Stage builder
COPY --from=builder /app/package*.json ./
# node_modules ในจุดนี้จะมี Prisma Client ที่ถูกสร้างขึ้นแล้วรวมอยู่ด้วย
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Copy folder prisma และ config มาด้วยสำหรับกรณีต้องรัน Migration ใน production
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]