#!/bin/bash

# 팀원용 초기 설정 스크립트
# git clone 후 처음 실행하는 스크립트

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
echo "🚀 VisitKorea 프로젝트 팀 설정 시작"
echo "=========================================="

# 1. Node.js 버전 확인
log_info "Node.js 버전 확인 중..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_info "✅ Node.js 설치됨: $NODE_VERSION"
    
    # Node.js 18 이상 권장
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        log_warn "⚠️  Node.js 18 이상을 권장합니다. 현재: $NODE_VERSION"
    fi
else
    log_error "❌ Node.js가 설치되지 않았습니다."
    log_info "Node.js 설치 방법:"
    echo "  - Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo "  - CentOS/RHEL: sudo yum install nodejs npm"
    echo "  - macOS: brew install node"
    echo "  - Windows: https://nodejs.org/ 에서 다운로드"
    exit 1
fi

# 2. npm 버전 확인
log_info "npm 버전 확인 중..."
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    log_info "✅ npm 설치됨: $NPM_VERSION"
else
    log_error "❌ npm이 설치되지 않았습니다."
    exit 1
fi

# 3. 의존성 설치
log_info "의존성 설치 중..."
if [ -f "package.json" ]; then
    npm install
    log_info "✅ 의존성 설치 완료"
else
    log_error "❌ package.json 파일을 찾을 수 없습니다."
    exit 1
fi

# 4. 환경 변수 파일 설정
log_info "환경 변수 파일 설정 중..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "✅ .env 파일 생성됨 (.env.example에서 복사)"
        log_warn "⚠️  .env 파일의 WAS 서버 IP를 실제 서버 IP로 변경해주세요."
    else
        # 기본 환경 변수 생성
        cat > .env << EOF
# VisitKorea 프로젝트 환경 변수
VITE_API_BASE_URL=http://localhost:3002
NODE_ENV=development
EOF
        log_info "✅ 기본 .env 파일 생성됨"
        log_warn "⚠️  .env 파일의 WAS 서버 IP를 실제 서버 IP로 변경해주세요."
    fi
else
    log_info "✅ .env 파일이 이미 존재합니다."
fi

# 5. 스크립트 실행 권한 설정
log_info "스크립트 실행 권한 설정 중..."
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh
    log_info "✅ 스크립트 실행 권한 설정 완료"
else
    log_warn "⚠️  scripts 디렉토리를 찾을 수 없습니다."
fi

# 6. 프론트엔드 빌드 테스트
log_info "프론트엔드 빌드 테스트 중..."
if [ -d "apps/frontend" ]; then
    cd apps/frontend
    
    # 프론트엔드 의존성 설치
    if [ -f "package.json" ]; then
        npm install
        log_info "✅ 프론트엔드 의존성 설치 완료"
    fi
    
    # 빌드 테스트
    if npm run build > /dev/null 2>&1; then
        log_info "✅ 프론트엔드 빌드 테스트 성공"
    else
        log_warn "⚠️  프론트엔드 빌드 테스트 실패 (WAS 서버 연결 문제일 수 있음)"
    fi
    
    cd ../..
else
    log_warn "⚠️  apps/frontend 디렉토리를 찾을 수 없습니다."
fi

# 7. nginx 설치 확인 (선택사항)
log_info "nginx 설치 확인 중..."
if command -v nginx > /dev/null 2>&1; then
    NGINX_VERSION=$(nginx -v 2>&1)
    log_info "✅ nginx 설치됨: $NGINX_VERSION"
else
    log_warn "⚠️  nginx가 설치되지 않았습니다. (프로덕션 배포 시 필요)"
    log_info "nginx 설치 방법:"
    echo "  - Ubuntu/Debian: sudo apt install nginx"
    echo "  - CentOS/RHEL: sudo yum install nginx"
    echo "  - macOS: brew install nginx"
fi

# 8. Git 설정 확인
log_info "Git 설정 확인 중..."
if [ -d ".git" ]; then
    log_info "✅ Git 저장소로 인식됨"
    
    # 현재 브랜치 확인
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    log_info "현재 브랜치: $CURRENT_BRANCH"
    
    # 원격 저장소 확인
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "none")
    log_info "원격 저장소: $REMOTE_URL"
else
    log_warn "⚠️  Git 저장소가 아닙니다."
fi

echo "=========================================="
echo "🎉 팀 설정 완료!"
echo "=========================================="

# 9. 다음 단계 안내
log_info "다음 단계:"
echo "1. .env 파일에서 WAS 서버 IP 설정"
echo "2. 개발 서버 실행: npm run dev"
echo "3. 프로덕션 배포: ./scripts/setup-env.sh [WAS_IP]"
echo ""
log_info "유용한 명령어:"
echo "  - 상태 확인: ./scripts/health-check.sh"
echo "  - 자동 복구: ./scripts/auto-recovery.sh"
echo "  - 환경 설정: ./scripts/setup-env.sh [WAS_IP]"
echo ""
log_info "문서:"
echo "  - README.md: 프로젝트 개요"
echo "  - docs/: 상세 가이드 문서들"
echo ""
log_warn "⚠️  WAS 서버 IP를 .env 파일에서 설정해주세요!"
