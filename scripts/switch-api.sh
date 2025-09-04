#!/bin/bash

# API 서버 전환 스크립트
# 사용법: ./scripts/switch-api.sh [API_SERVER_IP] [OPTIONS]

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

# 사용법 출력
show_usage() {
    echo "=========================================="
    echo "🔄 API 서버 전환 스크립트"
    echo "=========================================="
    echo ""
    echo "사용법:"
    echo "  ./scripts/switch-api.sh [API_SERVER_IP] [OPTIONS]"
    echo ""
    echo "예시:"
    echo "  ./scripts/switch-api.sh localhost        # 로컬 서버"
    echo "  ./scripts/switch-api.sh 192.168.1.100    # 팀원 서버"
    echo "  ./scripts/switch-api.sh 3.38.252.162     # 프로덕션 서버"
    echo ""
    echo "옵션:"
    echo "  --no-build    빌드 없이 설정만 변경"
    echo "  --test        연결 테스트만 수행"
    echo "  --help        이 도움말 표시"
    echo ""
    echo "사전 정의된 서버:"
    echo "  local         localhost:3002"
    echo "  dev           개발 서버"
    echo "  prod          프로덕션 서버"
    echo ""
}

# 사전 정의된 서버 설정
get_preset_server() {
    case $1 in
        "local")
            echo "localhost"
            ;;
        "dev")
            echo "192.168.1.100"  # 개발 서버 IP (팀에서 설정)
            ;;
        "prod")
            echo "13.209.108.148"   # 프로덕션 WAS 서버 IP
            ;;
        *)
            echo "$1"
            ;;
    esac
}

# 연결 테스트
test_connection() {
    local server_ip=$1
    local port=3002
    
    log_info "연결 테스트 중: $server_ip:$port"
    
    # ping 테스트
    if ping -c 1 -W 3 $server_ip > /dev/null 2>&1; then
        log_info "✅ 네트워크 연결 성공"
    else
        log_warn "⚠️  네트워크 연결 실패"
    fi
    
    # 포트 연결 테스트
    if timeout 5 bash -c "</dev/tcp/$server_ip/$port" 2>/dev/null; then
        log_info "✅ 포트 $port 연결 성공"
    else
        log_warn "⚠️  포트 $port 연결 실패"
    fi
    
    # HTTP 헬스체크
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$server_ip:$port/health 2>/dev/null || echo "000")
    
    if [ "$http_status" = "200" ]; then
        log_info "✅ HTTP 헬스체크 성공 (200)"
        return 0
    elif [ "$http_status" = "000" ]; then
        log_error "❌ HTTP 연결 실패"
        return 1
    else
        log_warn "⚠️  HTTP 응답: $http_status"
        return 1
    fi
}

# 메인 함수
main() {
    local api_server=""
    local no_build=false
    local test_only=false
    
    # 인수 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-build)
                no_build=true
                shift
                ;;
            --test)
                test_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "알 수 없는 옵션: $1"
                show_usage
                exit 1
                ;;
            *)
                if [ -z "$api_server" ]; then
                    api_server=$1
                fi
                shift
                ;;
        esac
    done
    
    # API 서버 IP 확인
    if [ -z "$api_server" ]; then
        log_error "API 서버 IP를 지정해주세요."
        show_usage
        exit 1
    fi
    
    # 사전 정의된 서버 확인
    api_server=$(get_preset_server "$api_server")
    
    echo "=========================================="
    echo "🔄 API 서버 전환: $api_server:3002"
    echo "=========================================="
    
    # 연결 테스트
    if ! test_connection "$api_server"; then
        log_warn "⚠️  연결 테스트 실패했지만 계속 진행합니다."
        read -p "계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "작업이 취소되었습니다."
            exit 0
        fi
    fi
    
    # 테스트만 수행하는 경우
    if [ "$test_only" = true ]; then
        log_info "연결 테스트 완료"
        exit 0
    fi
    
    # 환경 변수 파일 업데이트
    log_info "환경 변수 파일 업데이트 중..."
    if [ -f ".env" ]; then
        # 백업 생성
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        log_info "✅ .env 파일 백업 생성"
    fi
    
    # .env 파일 업데이트
    if grep -q "VITE_API_BASE_URL" .env 2>/dev/null; then
        sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://$api_server:3002|g" .env
    else
        echo "VITE_API_BASE_URL=http://$api_server:3002" >> .env
    fi
    
    log_info "✅ .env 파일 업데이트 완료"
    
    # 빌드 수행
    if [ "$no_build" = false ]; then
        log_info "프론트엔드 빌드 중..."
        if [ -d "apps/frontend" ]; then
            cd apps/frontend
            if npm run build > /dev/null 2>&1; then
                log_info "✅ 프론트엔드 빌드 성공"
            else
                log_warn "⚠️  프론트엔드 빌드 실패"
            fi
            cd ../..
        else
            log_warn "⚠️  apps/frontend 디렉토리를 찾을 수 없습니다."
        fi
    else
        log_info "빌드 건너뛰기 (--no-build 옵션)"
    fi
    
    # 최종 확인
    log_info "최종 설정 확인..."
    local current_api=$(grep "VITE_API_BASE_URL" .env | cut -d'=' -f2)
    log_info "현재 API 서버: $current_api"
    
    echo "=========================================="
    echo "🎉 API 서버 전환 완료!"
    echo "=========================================="
    log_info "새로운 API 서버: http://$api_server:3002"
    
    if [ "$no_build" = false ]; then
        log_info "프론트엔드를 새로고침하여 변경사항을 확인하세요."
    else
        log_warn "⚠️  빌드를 수행하지 않았습니다. 수동으로 빌드해주세요."
    fi
}

# 스크립트 실행
main "$@"
