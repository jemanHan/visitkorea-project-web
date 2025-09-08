# 🐳 Docker 기반 로컬 개발 환경 설정

팀원들이 EC2와 동일한 환경에서 로컬 개발을 할 수 있도록 Docker 기반 환경을 구축했습니다.

## 🚀 빠른 시작 (1분 설정)

### 1. Docker 설치
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **macOS**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

### 2. 프로젝트 클론 및 실행
```bash
# 프로젝트 클론
git clone https://github.com/jemanHan/visitkorea-project-web.git
cd visitkorea-project-web

# 한번에 모든 설정 및 실행
./scripts/setup-docker.sh
```

### 3. 접속
- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3002
- **데이터베이스**: localhost:5432

## 📋 포함된 서비스

### 🗄️ PostgreSQL 데이터베이스
- **컨테이너**: `vk-postgres`
- **포트**: 5432
- **사용자**: vk / vkpass
- **데이터베이스**: visitkorea

### 🔧 백엔드 API 서버
- **컨테이너**: `vk-backend`
- **포트**: 3002
- **기능**: Google Places API, 데이터베이스 연동

### 🌐 프론트엔드 웹 애플리케이션
- **컨테이너**: `vk-frontend`
- **포트**: 5173
- **기능**: React + Vite, Google Maps, 장소 검색

## 🛠️ 유용한 명령어

### 서비스 관리
```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f [service]

# 특정 서비스 재시작
docker-compose restart [service]

# 모든 서비스 중지
docker-compose down

# 데이터까지 완전 삭제
docker-compose down -v
```

### 개발 모드
```bash
# 백엔드만 재시작 (코드 변경 시)
docker-compose restart backend

# 프론트엔드만 재시작 (코드 변경 시)
docker-compose restart frontend

# 실시간 로그 확인
docker-compose logs -f frontend
```

## 🔧 환경 변수 설정

### 백엔드 환경 변수 (`apps/backend/.env.docker`)
```bash
PORT=3002
DATABASE_URL=postgresql://vk:vkpass@db:5432/visitkorea?schema=public
GOOGLE_PLACES_BACKEND_KEY=AIzaSyCnT1GyYL7Kz4xHOkbAhbAhT-pkaVOPV_U
NODE_ENV=development
```

### 프론트엔드 환경 변수 (`apps/frontend/.env.docker`)
```bash
VITE_API_BASE_URL=http://localhost:3002
VITE_GOOGLE_MAPS_BROWSER_KEY=AIzaSyCnT1GyYL7Kz4xHOkbAhbAhT-pkaVOPV_U
CHOKIDAR_USEPOLLING=true
```

## 🚨 문제 해결

### Google Maps가 안 뜨는 경우
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. API 키 설정에서 **HTTP 리퍼러** 추가: `http://localhost:5173/*`
3. 컨테이너 재시작: `docker-compose restart frontend`

### CORS 오류가 발생하는 경우
백엔드 CORS 설정에서 `http://localhost:5173` 허용 확인

### 데이터베이스 연결 오류
```bash
# 데이터베이스 로그 확인
docker-compose logs db

# 데이터베이스 재시작
docker-compose restart db
```

### 포트 충돌 오류
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :5432
netstat -tulpn | grep :3002
netstat -tulpn | grep :5173

# 기존 서비스 종료 후 재시작
docker-compose down
docker-compose up -d
```

## 📊 데이터베이스 관리

### Prisma 마이그레이션
```bash
# 새로운 마이그레이션 생성
docker-compose run --rm backend npx prisma migrate dev

# 마이그레이션 적용
docker-compose run --rm backend npx prisma migrate deploy

# 데이터베이스 스키마 확인
docker-compose run --rm backend npx prisma studio
```

### 데이터베이스 백업/복원
```bash
# 백업
docker exec vk-postgres pg_dump -U vk visitkorea > backup.sql

# 복원
docker exec -i vk-postgres psql -U vk visitkorea < backup.sql
```

## 🔄 EC2와 동일한 환경

이 Docker 설정은 EC2에서 실행되는 환경과 동일합니다:
- ✅ PostgreSQL 15
- ✅ Node.js 20
- ✅ 동일한 환경 변수
- ✅ Google API 키 설정
- ✅ Prisma 데이터베이스 스키마

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. Docker Desktop이 실행 중인지 확인
2. 포트 5432, 3002, 5173이 사용 가능한지 확인
3. Google API 키 제한 설정 확인
4. `docker-compose logs`로 오류 로그 확인

---

**🎉 이제 팀원들이 모두 동일한 환경에서 개발할 수 있습니다!**
