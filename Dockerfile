# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# ติดตั้ง dependency สำหรับ sharp (image processing)
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copy package files ก่อน (เพื่อ cache layer)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies สำหรับ build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

# ติดตั้ง dependency สำหรับ sharp runtime
RUN apk add --no-cache vips

# สร้าง non-root user เพื่อ security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies เท่านั้น
RUN npm ci --omit=dev

# Generate Prisma Client (production)
RUN npx prisma generate

# Copy build output จาก builder stage
COPY --from=builder /app/dist ./dist

# ─── สร้าง uploads directory และกำหนด permission ──────────────────────────────
# UPLOAD_DESTINATION ใน .env ต้องตรงกับ path นี้
RUN mkdir -p /app/uploads/documents && \
    chown -R appuser:appgroup /app/uploads && \
    chmod -R 755 /app/uploads

# ─── Volume สำหรับ persistent file storage ────────────────────────────────────
# ไฟล์ที่ upload จะถูกเก็บใน volume แทน container filesystem
VOLUME ["/app/uploads"]

# เปลี่ยนไปใช้ non-root user
USER appuser

# Expose port (ต้องตรงกับ PORT ใน .env)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

# Start app
CMD ["node", "dist/main"]
