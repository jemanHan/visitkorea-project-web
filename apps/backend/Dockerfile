# apps/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# Prisma generate (있다면)
RUN npx prisma generate || echo "Prisma not found, skipping generate"

# 빌드
RUN npm run build

# 프로덕션 이미지
FROM node:20-alpine AS production

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3002

# 프로덕션 모드로 실행
CMD ["npm", "run", "start"]

# 개발 모드용
FROM node:20-alpine AS development

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# Prisma generate (있다면)
RUN npx prisma generate || echo "Prisma not found, skipping generate"

EXPOSE 3002

# 개발 모드로 실행
CMD ["npm", "run", "dev"]
