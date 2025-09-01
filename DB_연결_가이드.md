# 🚀 VisitKorea 프로젝트 팀원용 실행 가이드

## 📋 목차
1. [필수 소프트웨어 설치](#1-필수-소프트웨어-설치)
2. [프로젝트 압축 해제 및 설정](#2-프로젝트-압축-해제-및-설정)
3. [Docker PostgreSQL 설정](#3-docker-postgresql-설정)
4. [환경변수 설정](#4-환경변수-설정)
5. [의존성 설치](#5-의존성-설치)
6. [데이터베이스 설정](#6-데이터베이스-설정)
7. [개발 서버 실행](#7-개발-서버-실행)
8. [테스트 및 확인](#8-테스트-및-확인)
9. [문제 해결](#9-문제-해결)

---

## 1. 필수 소프트웨어 설치

### Node.js 설치
```bash
# Node.js 18.x 이상 설치 필요
# https://nodejs.org/ko/ 에서 LTS 버전 다운로드

# 설치 확인
node --version
npm --version
```

### Docker Desktop 설치
```bash
# Docker Desktop 설치
# https://www.docker.com/products/docker-desktop/ 에서 다운로드

# 설치 후 Docker Desktop 실행
# Windows에서는 WSL2 필요할 수 있음

# 설치 확인
docker --version
docker-compose --version
```

### Git 설치 (선택사항)
```bash
# Git 설치
# https://git-scm.com/ 에서 다운로드

# 설치 확인
git --version
```

---

## 2. 프로젝트 압축 해제 및 설정

### 프로젝트 폴더 준비
```bash
# 1. 압축 파일을 원하는 위치에 해제
# 2. 프로젝트 폴더로 이동
cd FFFF

# 3. 프로젝트 구조 확인
dir
# 또는
ls -la
```

### 프로젝트 구조
```
FFFF/
├── apps/
│   ├── backend/     # Fastify 백엔드
│   ├── frontend/    # React 프론트엔드
│   └── infra/       # AWS CDK 인프라
├── packages/
│   ├── domain/      # 도메인 엔티티
│   ├── application/ # 유스케이스
│   ├── adapters/    # 외부 API 어댑터
│   └── shared-types # 공통 타입
└── package.json
```

---

## 3. Docker PostgreSQL 설정

### PostgreSQL 컨테이너 생성 및 실행
```bash
# 1. PostgreSQL 컨테이너 생성
docker run --name vk-postgres \
  -e POSTGRES_PASSWORD=test123 \
  -e POSTGRES_DB=visitkorea \
  -p 5432:5432 \
  -d postgres:15

# 2. 컨테이너 상태 확인
docker ps

# 3. 로그 확인 (문제가 있다면)
docker logs vk-postgres
```

### 컨테이너 관리 명령어
```bash
# 컨테이너 시작
docker start vk-postgres

# 컨테이너 중지
docker stop vk-postgres

# 컨테이너 재시작
docker restart vk-postgres

# 컨테이너 삭제 (필요시)
docker rm vk-postgres
```

---

## 4. 환경변수 설정

### 백엔드 환경변수 설정
```bash
# 1. apps/backend/.env 파일 생성
cd apps/backend

# 2. .env 파일에 다음 내용 추가
```

```env
# Database
DATABASE_URL="postgresql://postgres:test123@localhost:5432/visitkorea"

# Google Places API (팀장에게 요청)
GOOGLE_PLACES_API_KEY=your_api_key_here

# JWT Secret
JWT_SECRET=visitkorea_jwt_secret_2024

# Server
PORT=3002
NODE_ENV=development
```

### 프론트엔드 환경변수 설정
```bash
# 1. apps/frontend/.env 파일 생성 (필요시)
cd apps/frontend

# 2. .env 파일에 다음 내용 추가
```

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3002

# Google Maps API (팀장에게 요청)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

---

## 5. 의존성 설치

### 루트 의존성 설치
```bash
# 프로젝트 루트 디렉토리에서
cd FFFF
npm install
```

### 백엔드 의존성 설치
```bash
# 백엔드 디렉토리에서
cd apps/backend
npm install
```

### 프론트엔드 의존성 설치
```bash
# 프론트엔드 디렉토리에서
cd apps/frontend
npm install
```

### 패키지 의존성 설치
```bash
# 각 패키지 디렉토리에서
cd packages/domain
npm install

cd ../application
npm install

cd ../adapters
npm install

cd ../shared-types
npm install
```

---

## 6. 데이터베이스 설정

### Prisma 설정 및 마이그레이션
```bash
# 1. packages/db 디렉토리로 이동
cd packages/db

# 2. Prisma 클라이언트 생성
npx prisma generate

# 3. 데이터베이스 마이그레이션
npx prisma migrate dev --name init

# 4. 마이그레이션 상태 확인
npx prisma migrate status
```

### 데이터베이스 연결 확인
```bash
# 1. Prisma Studio 실행
npx prisma studio
# 브라우저에서 http://localhost:5555 열림

# 2. 테이블 확인
# - User 테이블
# - UserLike 테이블
```

### 데이터베이스 직접 접속
```bash
# PostgreSQL 컨테이너에 직접 접속
docker exec -it vk-postgres psql -U postgres -d visitkorea

# 테이블 목록 확인
\dt

# 데이터 확인
SELECT * FROM "User";
SELECT * FROM "UserLike";

# 종료
\q
```

---

## 7. 개발 서버 실행

### 백엔드 서버 실행
```bash
# 새 터미널에서
cd apps/backend
npm run dev

# 성공 시: http://localhost:3002 에서 서버 실행
# API 문서: http://localhost:3002/docs
```

### 프론트엔드 서버 실행
```bash
# 또 다른 터미널에서
cd apps/frontend
npm run dev

# 성공 시: http://localhost:5173 에서 앱 실행
```

### 전체 서버 상태 확인
```bash
# 실행 중인 서버 확인
netstat -ano | findstr :3002  # 백엔드
netstat -ano | findstr :5173  # 프론트엔드
netstat -ano | findstr :5555  # Prisma Studio
```

---

## 8. 테스트 및 확인

### 백엔드 API 테스트
```bash
# 1. 서버 상태 확인
curl http://localhost:3002/health

# 2. 사용자 등록 테스트
curl -X POST http://localhost:3002/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}"

# 3. 로그인 테스트
curl -X POST http://localhost:3002/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}"
```

### 프론트엔드 테스트
```bash
# 1. 브라우저에서 http://localhost:5173 접속
# 2. 회원가입/로그인 테스트
# 3. 장소 검색 테스트
# 4. 상세 페이지 테스트
# 5. 좋아요 기능 테스트
```

### 데이터베이스 테스트
```bash
# 1. Prisma Studio에서 데이터 확인
# 2. 사용자 생성 확인
# 3. 좋아요 데이터 저장 확인
```

---

## 9. 문제 해결

### 일반적인 문제들

#### Docker 관련
```bash
# 컨테이너가 실행되지 않는 경우
docker ps -a  # 모든 컨테이너 확인
docker logs vk-postgres  # 로그 확인
docker restart vk-postgres  # 재시작

# 포트 충돌 시
netstat -ano | findstr :5432  # 포트 사용 확인
```

#### 데이터베이스 연결 오류
```bash
# 연결 테스트
docker exec -it vk-postgres psql -U postgres -d visitkorea

# 마이그레이션 재실행
cd packages/db
npx prisma migrate reset
npx prisma migrate dev
```

#### 의존성 설치 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 또는 yarn 사용
yarn install
```

#### 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -ano | findstr :3002
netstat -ano | findstr :5173

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

---

## 10. 체크리스트

### 초기 설정
- [ ] Node.js 설치 (18.x 이상)
- [ ] Docker Desktop 설치 및 실행
- [ ] 프로젝트 압축 해제
- [ ] 환경변수 파일 생성

### 데이터베이스 설정
- [ ] PostgreSQL 컨테이너 실행
- [ ] Prisma 클라이언트 생성
- [ ] 데이터베이스 마이그레이션
- [ ] Prisma Studio 연결 확인

### 의존성 설치
- [ ] 루트 의존성 설치
- [ ] 백엔드 의존성 설치
- [ ] 프론트엔드 의존성 설치
- [ ] 패키지 의존성 설치

### 서버 실행
- [ ] 백엔드 서버 실행 (포트 3002)
- [ ] 프론트엔드 서버 실행 (포트 5173)
- [ ] Prisma Studio 실행 (포트 5555)

### 테스트
- [ ] 백엔드 API 테스트
- [ ] 프론트엔드 페이지 테스트
- [ ] 데이터베이스 연결 테스트
- [ ] 사용자 인증 테스트

---

## 11. 유용한 명령어 모음

### Docker
```bash
# 컨테이너 관리
docker ps                    # 실행 중인 컨테이너
docker ps -a                # 모든 컨테이너
docker start vk-postgres    # 컨테이너 시작
docker stop vk-postgres     # 컨테이너 중지
docker restart vk-postgres  # 컨테이너 재시작
docker logs vk-postgres     # 로그 확인
```

### Prisma
```bash
# 데이터베이스 관리
npx prisma generate         # 클라이언트 생성
npx prisma migrate dev      # 마이그레이션
npx prisma studio           # Studio 실행
npx prisma db pull          # 스키마 동기화
npx prisma migrate reset    # 데이터베이스 초기화
```

### npm
```bash
# 패키지 관리
npm install                 # 의존성 설치
npm run dev                 # 개발 서버 실행
npm run build               # 빌드
npm run test                # 테스트 실행
```

---

## 🎯 프로젝트 실행 완료 시 확인사항

1. ✅ **PostgreSQL**: Docker 컨테이너 실행 중
2. ✅ **백엔드**: http://localhost:3002 에서 API 서버 실행
3. ✅ **프론트엔드**: http://localhost:5173 에서 React 앱 실행
4. ✅ **데이터베이스**: Prisma Studio에서 테이블 확인 가능
5. ✅ **인증**: 회원가입/로그인 기능 정상 작동
6. ✅ **장소 검색**: Google Places API 연동 정상
7. ✅ **좋아요**: 사용자별 좋아요 기능 정상

---

## 📞 팀원 지원

### 문제 발생 시 확인사항
1. **Docker Desktop** 실행 상태
2. **환경변수** 파일 내용
3. **포트 사용** 상태
4. **의존성 설치** 완료 여부
5. **데이터베이스 연결** 상태

### 연락처
- **팀장**: [팀장 연락처]
- **기술 문서**: [문서 링크]
- **이슈 트래커**: [이슈 링크]

---

*마지막 업데이트: 2024년*
*버전: 1.0.0*
