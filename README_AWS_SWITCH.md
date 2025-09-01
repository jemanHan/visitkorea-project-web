# VisitKorea AWS 전환 가이드

## 🏠 로컬 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 데이터베이스 설정
```bash
# PostgreSQL Docker 컨테이너 실행
docker run --name vk-postgres -e POSTGRES_DB=vk -e POSTGRES_USER=vk -e POSTGRES_PASSWORD=vk -p 5432:5432 -d postgres:15

# Prisma 클라이언트 생성 및 마이그레이션
npm run db:generate
npm run db:migrate
```

### 3. 환경 변수 설정
```bash
# apps/backend/.env.local 파일 생성
cp apps/backend/env.local.example apps/backend/.env.local

# Google Places API 키 설정
# apps/backend/.env.local 파일에서 GOOGLE_PLACES_BACKEND_KEY 값을 실제 키로 변경
```

### 4. 개발 서버 실행
```bash
# 백엔드 서버 (터미널 1)
cd apps/backend
npm run dev

# 프론트엔드 서버 (터미널 2)
cd apps/frontend
npm run dev
```

### 5. 테스트
- 브라우저에서 `http://localhost:5173` 접속
- 상세 페이지에서 `/v1/detail/:placeId` 호출 확인 (캐시 동작 확인)
- 좋아요 기능 테스트: `POST /v1/likes`
- 추천 기능 테스트: `GET /v1/recommendations`
- 스케줄 생성 테스트: `POST /v1/itineraries`

---

## ☁️ AWS 배포 준비

### 1. AWS CDK 설치 및 설정
```bash
# AWS CLI 설정 (AWS 계정 필요)
aws configure

# CDK 부트스트랩 (최초 1회만)
cd apps/infra
npx cdk bootstrap
```

### 2. 인프라 빌드 및 검토
```bash
# 인프라 코드 빌드
npm run infra:build

# AWS와의 차이점 확인 (실제 배포하지 않음)
npm run infra:diff
```

### 3. 환경 변수 동기화
```bash
# CDK 출력 생성
npm run infra:outputs

# AWS 출력을 .env.aws 파일로 동기화
npm run env:sync:aws
```

### 4. 환경 변수 설정
```bash
# apps/backend/.env.aws 파일에서 다음 값들을 실제 값으로 변경:
# - GOOGLE_PLACES_BACKEND_KEY: 실제 Google Places API 키
# - DATABASE_URL: CDK에서 자동 설정됨
# - COGNITO_USER_POOL_ID: CDK에서 자동 설정됨
# - COGNITO_CLIENT_ID: CDK에서 자동 설정됨
# - COGNITO_REGION: CDK에서 자동 설정됨
```

---

## 🚀 AWS 배포 (실제 배포 시)

### 1. 인프라 배포
```bash
cd apps/infra
npx cdk deploy
```

### 2. 백엔드 배포
```bash
# 백엔드 빌드
npm run build:be

# Lambda 함수 배포 (CDK에서 자동 처리됨)
```

### 3. 프론트엔드 배포
```bash
# 프론트엔드 빌드
npm run build:fe

# S3에 업로드 (CDK에서 자동 처리됨)
```

---

## 🔄 환경 전환

### 로컬 → AWS 전환
```bash
# 1. 환경 변수 파일 변경
cp apps/backend/.env.aws apps/backend/.env

# 2. 서버 재시작
cd apps/backend
npm run dev
```

### AWS → 로컬 전환
```bash
# 1. 환경 변수 파일 변경
cp apps/backend/.env.local apps/backend/.env

# 2. 서버 재시작
cd apps/backend
npm run dev
```

---

## 🛡️ 무중단 롤백 계획

### 1. 이전 버전으로 롤백
```bash
# Git에서 이전 태그로 체크아웃
git checkout v1.0.0

# 인프라 롤백
cd apps/infra
npx cdk deploy

# 애플리케이션 롤백
npm run build:be
npm run build:fe
```

### 2. 데이터베이스 롤백
```bash
# RDS 스냅샷에서 복원 (AWS 콘솔에서 수동)
# 또는 마이그레이션 롤백
npm run db:migrate:rollback
```

---

## 📊 모니터링 및 로그

### CloudWatch 로그 확인
```bash
# Lambda 함수 로그
aws logs tail /aws/lambda/CoreStack-ApiFunction --follow

# API Gateway 로그
aws logs tail /aws/apigateway/VisitKorea-API --follow
```

### 데이터베이스 모니터링
- RDS 콘솔에서 성능 인사이트 확인
- RDS Proxy 메트릭 모니터링

---

## 🔧 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 실패**
   - VPC 보안 그룹 설정 확인
   - RDS Proxy 엔드포인트 확인

2. **Cognito 인증 실패**
   - User Pool 설정 확인
   - Client ID 확인

3. **Lambda 타임아웃**
   - 함수 타임아웃 설정 증가
   - VPC 설정 확인

4. **API Gateway CORS 오류**
   - CORS 설정 확인
   - 프론트엔드 도메인 허용

---

## 📝 참고 사항

- **비용 최적화**: t4g.micro 인스턴스 사용, 자동 스케일링 설정
- **보안**: VPC 내부 배치, RDS Proxy 사용, Cognito 인증
- **성능**: CloudFront 캐싱, RDS Proxy 커넥션 풀링
- **모니터링**: CloudWatch 로그, 메트릭 설정
