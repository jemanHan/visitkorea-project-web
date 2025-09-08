#!/bin/bash

# 프로덕션 빌드 및 배포 스크립트
# nginx + 빌드까지 포함된 완전한 프로덕션 환경

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

echo "=========================================="
echo "🚀 VisitKorea 프로덕션 빌드 및 배포"
echo "=========================================="

# 1. 기존 컨테이너 정리
log_info "기존 컨테이너 정리 중..."
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
docker system prune -f

# 2. 프론트엔드 빌드
log_info "프론트엔드 빌드 중..."
cd apps/frontend
npm run build
cd ../..

# 3. 빌드된 파일을 nginx 디렉토리로 복사
log_info "빌드된 파일 복사 중..."
mkdir -p nginx/html
cp -r apps/frontend/dist/* nginx/html/

# 4. 프로덕션 환경 변수 설정
log_info "프로덕션 환경 변수 설정 중..."
cat > apps/backend/.env.prod << EOF
PORT=3002
DATABASE_URL=postgresql://vk:vkpass@db:5432/visitkorea?schema=public
GOOGLE_PLACES_BACKEND_KEY=AIzaSyCnT1GyYL7Kz4xHOkbAhbAhT-pkaVOPV_U
NODE_ENV=production
EOF

# 5. 데이터베이스 시작
log_info "PostgreSQL 데이터베이스 시작 중..."
docker-compose -f docker-compose.prod.yml up -d db

# 6. 데이터베이스 헬스체크 대기
log_info "데이터베이스 준비 대기 중..."
for i in {1..30}; do
    if docker exec vk-postgres-prod pg_isready -U vk -d visitkorea > /dev/null 2>&1; then
        log_info "✅ 데이터베이스 준비 완료"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "❌ 데이터베이스 시작 실패"
        exit 1
    fi
    sleep 2
done

# 7. Prisma 설정 (있다면)
log_info "Prisma 설정 확인 중..."
if [ -f "apps/backend/prisma/schema.prisma" ]; then
    log_info "Prisma 스키마를 발견했습니다. 설정을 진행합니다..."
    
    # Prisma generate
    log_info "Prisma generate 실행 중..."
    docker-compose -f docker-compose.prod.yml run --rm backend npx prisma generate
    
    # Prisma migrate
    log_info "Prisma migrate 실행 중..."
    docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
    
    log_info "✅ Prisma 설정 완료"
else
    log_info "Prisma 스키마를 찾을 수 없습니다. 건너뜁니다."
fi

# 8. 프로덕션 서비스 시작
log_info "프로덕션 서비스 시작 중..."
docker-compose -f docker-compose.prod.yml up -d backend frontend nginx

# 9. 서비스 상태 확인
log_info "서비스 상태 확인 중..."
sleep 10

# 백엔드 확인
if curl -s http://localhost:3002/health > /dev/null 2>&1 || curl -s http://localhost:3002 > /dev/null 2>&1; then
    log_info "✅ 백엔드 서비스 정상"
else
    log_warn "⚠️  백엔드 서비스 확인 필요"
fi

# nginx 확인
if curl -s http://localhost:80 > /dev/null 2>&1; then
    log_info "✅ nginx 서비스 정상"
else
    log_warn "⚠️  nginx 서비스 확인 필요"
fi

echo "=========================================="
echo "🎉 프로덕션 배포 완료!"
echo "=========================================="

log_info "접속 정보:"
echo "  🌐 웹사이트: http://localhost"
echo "  🔧 백엔드 API: http://localhost:3002"
echo "  🗄️  데이터베이스: localhost:5432"
echo ""

log_info "유용한 명령어:"
echo "  📊 서비스 상태: docker-compose -f docker-compose.prod.yml ps"
echo "  📝 로그 확인: docker-compose -f docker-compose.prod.yml logs -f [service]"
echo "  🔄 재시작: docker-compose -f docker-compose.prod.yml restart [service]"
echo "  🛑 중지: docker-compose -f docker-compose.prod.yml down"
echo "  🗑️  완전 삭제: docker-compose -f docker-compose.prod.yml down -v"
echo ""

log_info "프로덕션 환경 특징:"
echo "  ✅ nginx 리버스 프록시"
echo "  ✅ 정적 파일 최적화"
echo "  ✅ Gzip 압축"
echo "  ✅ 보안 헤더"
echo "  ✅ 캐싱 설정"
echo "  ✅ CORS 설정"
echo ""

log_warn "⚠️  Google Maps API 키 제한 설정:"
echo "  Google Cloud Console에서 http://localhost 도메인을 허용으로 추가해주세요."
echo ""

log_info "문제 해결:"
echo "  - CORS 오류: nginx 설정 확인"
echo "  - 지도 안뜸: Google API 키 제한 설정 확인"
echo "  - DB 연결 오류: docker-compose -f docker-compose.prod.yml logs db 확인"
echo "  - 포트 충돌: 기존 서비스 종료 후 재시작"
