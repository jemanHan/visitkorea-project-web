#!/bin/bash

# 연결 상태 모니터링 스크립트
# 사용법: ./scripts/health-check.sh [WAS_SERVER_IP]

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

# WAS 서버 IP 설정
WAS_SERVER_IP=${1:-"3.38.252.162"}
WAS_PORT="3002"

echo "=========================================="
echo "🔍 연결 상태 모니터링 시작"
echo "=========================================="

# 1. 네트워크 연결 테스트
log_info "네트워크 연결 테스트..."
if ping -c 3 -W 5 ${WAS_SERVER_IP} > /dev/null 2>&1; then
    log_info "✅ 네트워크 연결 성공"
else
    log_error "❌ 네트워크 연결 실패"
fi

# 2. 포트 연결 테스트
log_info "포트 연결 테스트..."
if timeout 5 bash -c "</dev/tcp/${WAS_SERVER_IP}/${WAS_PORT}" 2>/dev/null; then
    log_info "✅ 포트 ${WAS_PORT} 연결 성공"
else
    log_error "❌ 포트 ${WAS_PORT} 연결 실패"
fi

# 3. HTTP 헬스체크
log_info "HTTP 헬스체크..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://${WAS_SERVER_IP}:${WAS_PORT}/health 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    log_info "✅ HTTP 헬스체크 성공 (200)"
elif [ "$HTTP_STATUS" = "000" ]; then
    log_error "❌ HTTP 연결 실패"
else
    log_warn "⚠️  HTTP 응답: ${HTTP_STATUS}"
fi

# 4. nginx 상태 확인
log_info "nginx 상태 확인..."
if systemctl is-active --quiet nginx; then
    log_info "✅ nginx 서비스 실행 중"
else
    log_error "❌ nginx 서비스 중지됨"
fi

# 5. nginx 설정 확인
log_info "nginx 설정 확인..."
if sudo nginx -t > /dev/null 2>&1; then
    log_info "✅ nginx 설정 올바름"
else
    log_error "❌ nginx 설정 오류"
fi

# 6. 최근 nginx 에러 로그 확인
log_info "최근 nginx 에러 로그 확인..."
RECENT_ERRORS=$(sudo tail -5 /var/log/nginx/error.log 2>/dev/null | grep -c "error" || echo "0")
if [ "$RECENT_ERRORS" -gt 0 ]; then
    log_warn "⚠️  최근 에러 로그 ${RECENT_ERRORS}개 발견"
    sudo tail -3 /var/log/nginx/error.log | grep "error" || true
else
    log_info "✅ 최근 에러 로그 없음"
fi

# 7. 환경 변수 확인
log_info "환경 변수 확인..."
if [ -f ".env" ]; then
    if grep -q "VITE_API_BASE_URL" .env; then
        API_URL=$(grep "VITE_API_BASE_URL" .env | cut -d'=' -f2)
        log_info "✅ 환경 변수 설정됨: ${API_URL}"
    else
        log_warn "⚠️  VITE_API_BASE_URL 환경 변수 없음"
    fi
else
    log_warn "⚠️  .env 파일 없음"
fi

echo "=========================================="
echo "🏁 모니터링 완료"
echo "=========================================="

# 종합 상태 판단
if [ "$HTTP_STATUS" = "200" ] && systemctl is-active --quiet nginx; then
    log_info "🎉 전체 시스템 정상 동작 중"
    exit 0
else
    log_error "🚨 시스템 문제 발견 - 수동 확인 필요"
    exit 1
fi
