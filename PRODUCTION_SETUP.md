# 🚀 프로덕션 환경 설정 (nginx + 빌드 포함)

EC2와 동일한 완전한 프로덕션 환경을 로컬에서 구축하는 방법입니다.

## 🎯 포함된 기능

### ✅ **완전한 프로덕션 스택**
- **PostgreSQL 15** - 데이터베이스
- **Node.js 20** - 백엔드 API 서버
- **React + Vite** - 프론트엔드 (빌드됨)
- **nginx** - 리버스 프록시 및 정적 파일 서빙
- **Docker Compose** - 모든 서비스 오케스트레이션

### ✅ **프로덕션 최적화**
- **정적 파일 캐싱** - 1년 캐시
- **Gzip 압축** - 전송 크기 최적화
- **보안 헤더** - XSS, CSRF 보호
- **CORS 설정** - API 요청 허용
- **SPA 라우팅** - React Router 지원

## 🚀 빠른 시작

### 1. 프로덕션 빌드 및 배포
```bash
# 한번에 모든 설정 및 배포
./scripts/build-and-deploy.sh
```

### 2. 접속
- **웹사이트**: http://localhost
- **백엔드 API**: http://localhost:3002
- **데이터베이스**: localhost:5432

## 📋 서비스 구성

### 🗄️ PostgreSQL 데이터베이스
- **컨테이너**: `vk-postgres-prod`
- **포트**: 5432
- **사용자**: vk / vkpass
- **데이터베이스**: visitkorea

### 🔧 백엔드 API 서버
- **컨테이너**: `vk-backend-prod`
- **포트**: 3002
- **기능**: Google Places API, 데이터베이스 연동
- **모드**: 프로덕션 (최적화됨)

### 🌐 프론트엔드 웹 애플리케이션
- **컨테이너**: `vk-frontend-prod`
- **포트**: 80 (nginx를 통해)
- **기능**: React + Vite (빌드됨), Google Maps, 장소 검색

### 🔄 nginx 리버스 프록시
- **컨테이너**: `vk-nginx-prod`
- **포트**: 80, 443
- **기능**: 정적 파일 서빙, API 프록시, 캐싱, 압축

## 🛠️ 관리 명령어

### 서비스 관리
```bash
# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f [service]

# 특정 서비스 재시작
docker-compose -f docker-compose.prod.yml restart [service]

# 모든 서비스 중지
docker-compose -f docker-compose.prod.yml down

# 데이터까지 완전 삭제
docker-compose -f docker-compose.prod.yml down -v
```

### 개발 모드 vs 프로덕션 모드
```bash
# 개발 모드 (핫 리로드)
docker-compose up -d

# 프로덕션 모드 (빌드 + nginx)
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 nginx 설정

### 주요 기능
- **정적 파일 캐싱**: JS, CSS, 이미지 파일 1년 캐시
- **Gzip 압축**: 텍스트 파일 압축 전송
- **API 프록시**: `/api/` 요청을 백엔드로 전달
- **SPA 라우팅**: React Router 지원
- **보안 헤더**: XSS, CSRF 보호
- **CORS 설정**: API 요청 허용

### 설정 파일 위치
- `nginx/nginx.conf` - 메인 nginx 설정
- `nginx/conf.d/visitkorea.conf` - VisitKorea 전용 설정

## 📊 성능 최적화

### 프론트엔드 최적화
- **빌드 최적화**: Vite 프로덕션 빌드
- **코드 스플리팅**: 자동 청크 분할
- **트리 셰이킹**: 사용하지 않는 코드 제거
- **압축**: Gzip 압축

### 백엔드 최적화
- **프로덕션 모드**: NODE_ENV=production
- **의존성 최적화**: 프로덕션 의존성만 설치
- **보안**: non-root 사용자로 실행

### nginx 최적화
- **정적 파일 캐싱**: 1년 캐시
- **Gzip 압축**: 전송 크기 최적화
- **연결 풀링**: 백엔드 연결 재사용
- **보안 헤더**: 보안 강화

## 🚨 문제 해결

### Google Maps가 안 뜨는 경우
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. API 키 설정에서 **HTTP 리퍼러** 추가: `http://localhost/*`
3. 컨테이너 재시작: `docker-compose -f docker-compose.prod.yml restart frontend`

### CORS 오류가 발생하는 경우
nginx 설정에서 CORS 헤더가 자동으로 추가됩니다. 문제가 지속되면:
```bash
# nginx 로그 확인
docker-compose -f docker-compose.prod.yml logs nginx
```

### 데이터베이스 연결 오류
```bash
# 데이터베이스 로그 확인
docker-compose -f docker-compose.prod.yml logs db

# 데이터베이스 재시작
docker-compose -f docker-compose.prod.yml restart db
```

### 포트 충돌 오류
```bash
# 사용 중인 포트 확인
netstat -tulpn | grep :80
netstat -tulpn | grep :3002
netstat -tulpn | grep :5432

# 기존 서비스 종료 후 재시작
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 EC2와 동일한 환경

이 프로덕션 설정은 EC2에서 실행되는 환경과 동일합니다:
- ✅ PostgreSQL 15
- ✅ Node.js 20 (프로덕션 모드)
- ✅ nginx 리버스 프록시
- ✅ 정적 파일 최적화
- ✅ 보안 헤더
- ✅ Google API 키 설정
- ✅ Prisma 데이터베이스 스키마

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. Docker Desktop이 실행 중인지 확인
2. 포트 80, 3002, 5432가 사용 가능한지 확인
3. Google API 키 제한 설정 확인
4. `docker-compose -f docker-compose.prod.yml logs`로 오류 로그 확인

---

**🎉 이제 완전한 프로덕션 환경에서 개발할 수 있습니다!**
