#!/bin/bash

# 환경 설정 자동화 스크립트
# 사용법: ./scripts/setup-env.sh [WAS_SERVER_IP]

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

# WAS 서버 IP 설정
WAS_SERVER_IP=${1:-"3.38.252.162"}
WAS_PORT="3002"

log_info "WAS 서버 설정: ${WAS_SERVER_IP}:${WAS_PORT}"

# 1. 환경 변수 파일 생성
log_info "환경 변수 파일 생성 중..."
cat > .env << EOF
# 자동 생성된 환경 변수 파일
VITE_API_BASE_URL=http://${WAS_SERVER_IP}:${WAS_PORT}
NODE_ENV=production
EOF

# 2. nginx 설정 업데이트
log_info "nginx 설정 업데이트 중..."
sudo cp /etc/nginx/conf.d/visitkorea.conf /etc/nginx/conf.d/visitkorea.conf.backup.$(date +%Y%m%d_%H%M%S)

sudo tee /etc/nginx/conf.d/visitkorea.conf > /dev/null << EOF
server {
    listen 80 default_server;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /v1/ {
        proxy_pass http://${WAS_SERVER_IP}:${WAS_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 연결 타임아웃 설정
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
EOF

# 3. nginx 설정 테스트
log_info "nginx 설정 테스트 중..."
if sudo nginx -t; then
    log_info "nginx 설정이 올바릅니다."
else
    log_error "nginx 설정에 오류가 있습니다."
    exit 1
fi

# 4. nginx 재시작
log_info "nginx 재시작 중..."
sudo systemctl reload nginx

# 5. 연결 테스트
log_info "WAS 서버 연결 테스트 중..."
if curl -s --connect-timeout 5 http://${WAS_SERVER_IP}:${WAS_PORT}/health > /dev/null; then
    log_info "WAS 서버 연결 성공!"
else
    log_warn "WAS 서버 연결 실패. 서버 상태를 확인해주세요."
fi

# 6. 프론트엔드 빌드 (필요시)
if [ -d "apps/frontend" ]; then
    log_info "프론트엔드 빌드 중..."
    cd apps/frontend
    npm run build
    cd ../..
    
    # 빌드된 파일을 nginx 디렉토리로 복사
    sudo cp -r apps/frontend/dist/* /usr/share/nginx/html/
    log_info "프론트엔드 배포 완료"
fi

log_info "설정 완료! WAS 서버: ${WAS_SERVER_IP}:${WAS_PORT}"
