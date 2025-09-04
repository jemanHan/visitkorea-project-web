#!/bin/bash

# 자동 복구 스크립트
# 시스템 문제 발생 시 자동으로 복구 시도

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo "=========================================="
echo "🔧 자동 복구 시스템 시작"
echo "=========================================="

# 1. nginx 서비스 복구
log_info "nginx 서비스 상태 확인 및 복구..."
if ! systemctl is-active --quiet nginx; then
    log_warn "nginx 서비스 중지됨 - 재시작 시도..."
    sudo systemctl start nginx
    sleep 2
    if systemctl is-active --quiet nginx; then
        log_info "✅ nginx 서비스 복구 성공"
    else
        log_error "❌ nginx 서비스 복구 실패"
    fi
else
    log_info "✅ nginx 서비스 정상 동작 중"
fi

# 2. nginx 설정 복구
log_info "nginx 설정 확인 및 복구..."
if ! sudo nginx -t > /dev/null 2>&1; then
    log_warn "nginx 설정 오류 - 백업에서 복구 시도..."
    if [ -f "/etc/nginx/conf.d/visitkorea.conf.backup" ]; then
        sudo cp /etc/nginx/conf.d/visitkorea.conf.backup /etc/nginx/conf.d/visitkorea.conf
        if sudo nginx -t > /dev/null 2>&1; then
            log_info "✅ nginx 설정 복구 성공"
            sudo systemctl reload nginx
        else
            log_error "❌ nginx 설정 복구 실패"
        fi
    else
        log_error "❌ 백업 설정 파일 없음"
    fi
else
    log_info "✅ nginx 설정 정상"
fi

# 3. 환경 변수 파일 복구
log_info "환경 변수 파일 확인 및 복구..."
if [ ! -f ".env" ]; then
    log_warn ".env 파일 없음 - 기본값으로 생성..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "✅ .env 파일 복구 성공"
    else
        # 기본 환경 변수 생성
        cat > .env << EOF
VITE_API_BASE_URL=http://3.38.252.162:3002
NODE_ENV=production
EOF
        log_info "✅ 기본 .env 파일 생성"
    fi
else
    log_info "✅ .env 파일 존재"
fi

# 4. 프론트엔드 파일 확인
log_info "프론트엔드 파일 확인..."
if [ ! -d "/usr/share/nginx/html" ] || [ -z "$(ls -A /usr/share/nginx/html 2>/dev/null)" ]; then
    log_warn "프론트엔드 파일 없음 - 빌드 및 배포 시도..."
    if [ -d "apps/frontend" ]; then
        cd apps/frontend
        npm run build
        cd ../..
        sudo cp -r apps/frontend/dist/* /usr/share/nginx/html/
        log_info "✅ 프론트엔드 배포 완료"
    else
        log_error "❌ 프론트엔드 소스 없음"
    fi
else
    log_info "✅ 프론트엔드 파일 존재"
fi

# 5. 로그 정리
log_info "로그 파일 정리..."
sudo find /var/log/nginx -name "*.log" -size +100M -exec truncate -s 50M {} \; 2>/dev/null || true
log_info "✅ 로그 파일 정리 완료"

echo "=========================================="
echo "🏁 자동 복구 완료"
echo "=========================================="

# 최종 상태 확인
log_info "최종 상태 확인 중..."
if ./scripts/health-check.sh > /dev/null 2>&1; then
    log_info "🎉 시스템 정상 복구 완료!"
else
    log_warn "⚠️  일부 문제가 남아있을 수 있습니다. 수동 확인이 필요합니다."
fi
