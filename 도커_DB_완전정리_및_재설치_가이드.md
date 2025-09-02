# 🗑️ 도커 및 DB 완전 정리 후 재설치 가이드

## ⚠️ **주의사항**
이 가이드는 **기존 도커 환경과 데이터베이스를 완전히 삭제**합니다.
**중요한 데이터가 있다면 반드시 백업 후 진행**하세요!

---

## 🧹 **1단계: 기존 도커 컨테이너 및 이미지만 정리**

### **1.1 실행 중인 컨테이너 정리**
```bash
# 실행 중인 모든 컨테이너 중지
docker stop $(docker ps -aq)

# 모든 컨테이너 삭제
docker rm $(docker ps -aq)
```

### **1.2 도커 이미지 정리**
```bash
# 모든 이미지 삭제
docker rmi $(docker images -q)

# 또는 특정 이미지만 삭제 (postgres 관련)
docker images | grep postgres | awk '{print $3}' | xargs docker rmi
```

### **1.3 볼륨 및 네트워크 정리**
```bash
# 모든 볼륨 삭제
docker volume rm $(docker volume ls -q)

# 모든 네트워크 삭제
docker network rm $(docker network ls -q)

# 도커 시스템 정리 (사용하지 않는 리소스)
docker system prune -a --volumes
```

### **1.4 PostgreSQL 관련 리소스 특별 정리**
```bash
# PostgreSQL 컨테이너가 있다면 강제 삭제
docker rm -f visitkorea_postgres 2>/dev/null || true

# PostgreSQL 볼륨 삭제
docker volume rm ffff_postgres_data 2>/dev/null || true

# 5432 포트 사용 중인 프로세스 확인
netstat -ano | findstr :5432  # Windows
lsof -i :5432                 # macOS/Linux
```

---

## 🆕 **2단계: 도커 환경 확인 및 준비**

### **2.1 Docker Desktop 실행 확인**
```bash
# Docker Desktop이 실행 중인지 확인
# 시스템 트레이에서 Docker 아이콘 확인
# 또는 Docker Desktop 앱 실행
```

### **2.2 도커 상태 확인**
```bash
# 도커 버전 확인
docker --version
docker-compose --version

# 도커 데몬 실행 확인
docker info

# 현재 실행 중인 컨테이너 확인
docker ps
```

---

## 🗄️ **3단계: PostgreSQL 컨테이너 새로 생성**

### **3.1 docker-compose.yml 파일 생성**
프로젝트 루트에 `docker-compose.yml` 파일을 생성하세요:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: visitkorea_postgres
    environment:
      POSTGRES_DB: visitkorea_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### **3.2 컨테이너 실행**
```bash
# 프로젝트 루트 디렉토리에서
docker-compose up -d

# 실행 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres
```

---

## 🔧 **4단계: 데이터베이스 스키마 설정**

### **4.1 Prisma 의존성 설치**
```bash
# 프로젝트 루트에서
npm install

# 또는 개별 패키지에서
cd packages/db
npm install
```

### **4.2 Prisma 스키마 생성**
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev --name init

# 또는 스키마 동기화 (마이그레이션 없이)
npx prisma db push
```

### **4.3 Prisma Studio 실행 (데이터베이스 GUI)**
```bash
npx prisma studio
```

---

## 🌍 **5단계: 환경 변수 설정**

### **5.1 .env 파일 생성**
프로젝트 루트에 `.env` 파일을 생성하세요:

```env
# 데이터베이스 연결
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/visitkorea_db"

# JWT 시크릿
JWT_SECRET="your-super-secret-jwt-key-here"

# Google Places API 키
GOOGLE_PLACES_API_KEY="your-google-places-api-key"

# 서버 포트
PORT=3000
```

---

## ✅ **6단계: 설치 확인**

### **6.1 데이터베이스 연결 테스트**
```bash
# PostgreSQL 컨테이너에 직접 연결
docker exec -it visitkorea_postgres psql -U postgres -d visitkorea_db

# 테이블 목록 확인
\dt

# 연결 종료
\q
```

### **6.2 Prisma 연결 테스트**
```bash
# Prisma Studio 실행
npx prisma studio

# 브라우저에서 http://localhost:5555 접속
# 데이터베이스 연결 상태 확인
```

---

## 🚨 **문제 해결 (Troubleshooting)**

### **문제 1: 포트 충돌**
```bash
# 5432 포트 사용 중인 프로세스 확인
netstat -ano | findstr :5432  # Windows
lsof -i :5432                 # macOS/Linux

# 해당 프로세스 종료 후 재시도
```

### **문제 2: 권한 문제**
```bash
# Windows: 관리자 권한으로 PowerShell 실행
# macOS/Linux: sudo 사용
sudo docker-compose up -d
```

### **문제 3: 볼륨 마운트 실패**
```bash
# 볼륨 삭제 후 재생성
docker volume rm ffff_postgres_data
docker-compose up -d
```

### **문제 4: Prisma 연결 실패**
```bash
# 환경변수 확인
echo $DATABASE_URL

# 데이터베이스 컨테이너 상태 확인
docker-compose ps

# Prisma 클라이언트 재생성
npx prisma generate
```

---

## 📋 **체크리스트**

- [ ] 기존 도커 환경 완전 정리
- [ ] Docker Desktop 새로 설치
- [ ] docker-compose.yml 파일 생성
- [ ] PostgreSQL 컨테이너 실행
- [ ] Prisma 의존성 설치
- [ ] 데이터베이스 스키마 생성
- [ ] 환경변수 설정
- [ ] 연결 테스트 완료

---

## 🎯 **성공 기준**

✅ **Docker Desktop 정상 실행**  
✅ **PostgreSQL 컨테이너 정상 실행 (포트 5432)**  
✅ **Prisma Studio 접속 가능 (포트 5555)**  
✅ **데이터베이스 테이블 생성 완료**  
✅ **Backend 서버에서 DB 연결 성공**

---

## 🔄 **컨테이너 정리 후 권장사항**

1. **Docker Desktop 재시작** (시스템 트레이에서 우클릭 → Restart)
2. **도커 시스템 상태 확인**: `docker system df`
3. **새로운 컨테이너 실행 전 도커 상태 점검**  

---

## 💡 **추가 팁**

1. **Docker Desktop은 그대로 유지하고 컨테이너만 정리**
2. **방화벽에서 5432, 5555 포트 허용**
3. **안티바이러스에서 도커 프로세스 예외 처리**
4. **문제 발생 시 도커 로그 확인: `docker-compose logs -f`**
5. **컨테이너 정리 후 Docker Desktop 재시작 권장**

---

**이 가이드를 따라하면 깨끗한 환경에서 도커와 DB를 새로 설치할 수 있습니다!** 🚀✨
