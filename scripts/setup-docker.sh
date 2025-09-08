#!/bin/bash

# Docker 기반 로컬 개발 환경 설정 스크립트
# 팀원들이 한번에 설치할 수 있는 스크립트

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
echo "🐳 VisitKorea Docker 개발 환경 설정"
echo "=========================================="

# 1. Docker 설치 확인
log_info "Docker 설치 확인 중..."
if command -v docker > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    log_info "✅ Docker 설치됨: $DOCKER_VERSION"
else
    log_error "❌ Docker가 설치되지 않았습니다."
    log_info "Docker 설치 방법:"
    echo "  - Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  - macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  - Ubuntu: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

# 2. Docker Compose 설치 확인
log_info "Docker Compose 설치 확인 중..."
if command -v docker-compose > /dev/null 2>&1 || docker compose version > /dev/null 2>&1; then
    if command -v docker-compose > /dev/null 2>&1; then
        COMPOSE_VERSION=$(docker-compose --version)
    else
        COMPOSE_VERSION=$(docker compose version)
    fi
    log_info "✅ Docker Compose 설치됨: $COMPOSE_VERSION"
else
    log_error "❌ Docker Compose가 설치되지 않았습니다."
    log_info "Docker Compose 설치 방법:"
    echo "  - Docker Desktop과 함께 자동 설치됨"
    echo "  - Linux: https://docs.docker.com/compose/install/"
    exit 1
fi

# 3. Docker 서비스 실행 확인
log_info "Docker 서비스 실행 확인 중..."
if docker info > /dev/null 2>&1; then
    log_info "✅ Docker 서비스가 실행 중입니다."
else
    log_error "❌ Docker 서비스가 실행되지 않았습니다."
    log_info "Docker Desktop을 실행해주세요."
    exit 1
fi

# 4. 기존 컨테이너 정리 (선택사항)
log_info "기존 컨테이너 정리 중..."
if docker ps -a --format "table {{.Names}}" | grep -q "vk-"; then
    log_warn "기존 VisitKorea 컨테이너를 발견했습니다."
    read -p "기존 컨테이너를 삭제하고 새로 시작하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v 2>/dev/null || docker compose down -v 2>/dev/null || true
        log_info "✅ 기존 컨테이너 정리 완료"
    fi
fi

# 5. 데이터베이스 먼저 시작
log_info "PostgreSQL 데이터베이스 시작 중..."
if command -v docker-compose > /dev/null 2>&1; then
    docker-compose up -d db
else
    docker compose up -d db
fi

# 6. 데이터베이스 헬스체크 대기
log_info "데이터베이스 준비 대기 중..."
for i in {1..30}; do
    if docker exec vk-postgres pg_isready -U vk -d visitkorea > /dev/null 2>&1; then
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
    if command -v docker-compose > /dev/null 2>&1; then
        docker-compose run --rm backend npx prisma generate
    else
        docker compose run --rm backend npx prisma generate
    fi
    
    # Prisma migrate
    log_info "Prisma migrate 실행 중..."
    if command -v docker-compose > /dev/null 2>&1; then
        docker-compose run --rm backend npx prisma migrate deploy
    else
        docker compose run --rm backend npx prisma migrate deploy
    fi
    
    # 시드 데이터 (있다면)
    if [ -f "apps/backend/prisma/seed.js" ] || [ -f "apps/backend/prisma/seed.ts" ]; then
        log_info "시드 데이터 실행 중..."
        if command -v docker-compose > /dev/null 2>&1; then
            docker-compose run --rm backend node prisma/seed.js 2>/dev/null || docker-compose run --rm backend npx ts-node prisma/seed.ts 2>/dev/null || true
        else
            docker compose run --rm backend node prisma/seed.js 2>/dev/null || docker compose run --rm backend npx ts-node prisma/seed.ts 2>/dev/null || true
        fi
    fi
    
    log_info "✅ Prisma 설정 완료"
else
    log_info "Prisma 스키마를 찾을 수 없습니다. 건너뜁니다."
fi

# 8. 애플리케이션 시작
log_info "백엔드 및 프론트엔드 시작 중..."
if command -v docker-compose > /dev/null 2>&1; then
    docker-compose up -d backend frontend
else
    docker compose up -d backend frontend
fi

# 9. 서비스 상태 확인
log_info "서비스 상태 확인 중..."
sleep 10

# 백엔드 확인
if curl -s http://localhost:3002/health > /dev/null 2>&1 || curl -s http://localhost:3002 > /dev/null 2>&1; then
    log_info "✅ 백엔드 서비스 정상"
else
    log_warn "⚠️  백엔드 서비스 확인 필요"
fi

# 프론트엔드 확인
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    log_info "✅ 프론트엔드 서비스 정상"
else
    log_warn "⚠️  프론트엔드 서비스 확인 필요"
fi

echo "=========================================="
echo "🎉 Docker 개발 환경 설정 완료!"
echo "=========================================="

log_info "접속 정보:"
echo "  🌐 프론트엔드: http://localhost:5173"
echo "  🔧 백엔드 API: http://localhost:3002"
echo "  🗄️  데이터베이스: localhost:5432"
echo ""

log_info "유용한 명령어:"
echo "  📊 서비스 상태: docker-compose ps"
echo "  📝 로그 확인: docker-compose logs -f [service]"
echo "  🔄 재시작: docker-compose restart [service]"
echo "  🛑 중지: docker-compose down"
echo "  🗑️  완전 삭제: docker-compose down -v"
echo ""

log_warn "⚠️  Google Maps API 키 제한 설정:"
echo "  Google Cloud Console에서 http://localhost:5173 도메인을 허용으로 추가해주세요."
echo ""

log_info "문제 해결:"
echo "  - CORS 오류: 백엔드 CORS 설정 확인"
echo "  - 지도 안뜸: Google API 키 제한 설정 확인"
echo "  - DB 연결 오류: docker-compose logs db 확인"
echo "  - 포트 충돌: 기존 서비스 종료 후 재시작"
