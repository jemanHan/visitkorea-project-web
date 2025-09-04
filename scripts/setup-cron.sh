#!/bin/bash

# cron 작업 설정 스크립트
# 정기적인 모니터링 및 자동 복구 설정

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

PROJECT_DIR="/home/ec2-user/visitkorea-project"

log_info "cron 작업 설정 중..."

# 1. 기존 cron 작업 백업
if crontab -l > /dev/null 2>&1; then
    crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S)
    log_info "기존 cron 작업 백업 완료"
fi

# 2. 새로운 cron 작업 추가
cat > /tmp/new_crontab << EOF
# VisitKorea 프로젝트 자동 모니터링 및 복구
# 매 5분마다 헬스체크 실행
*/5 * * * * cd ${PROJECT_DIR} && ./scripts/health-check.sh >> /var/log/visitkorea-health.log 2>&1

# 매 30분마다 자동 복구 시도 (문제 발생 시에만)
*/30 * * * * cd ${PROJECT_DIR} && ./scripts/auto-recovery.sh >> /var/log/visitkorea-recovery.log 2>&1

# 매일 새벽 2시에 로그 정리
0 2 * * * find /var/log -name "visitkorea-*.log" -size +100M -exec truncate -s 50M {} \; 2>/dev/null || true

# 매주 일요일 새벽 3시에 전체 시스템 점검
0 3 * * 0 cd ${PROJECT_DIR} && ./scripts/health-check.sh > /var/log/visitkorea-weekly-check.log 2>&1
EOF

# 3. 기존 cron 작업과 병합
if crontab -l > /dev/null 2>&1; then
    (crontab -l; echo ""; cat /tmp/new_crontab) | crontab -
else
    crontab /tmp/new_crontab
fi

# 4. 로그 디렉토리 생성
sudo mkdir -p /var/log
sudo touch /var/log/visitkorea-health.log
sudo touch /var/log/visitkorea-recovery.log
sudo chown ec2-user:ec2-user /var/log/visitkorea-*.log

log_info "✅ cron 작업 설정 완료"
log_info "설정된 작업:"
echo "  - 매 5분: 헬스체크"
echo "  - 매 30분: 자동 복구"
echo "  - 매일 새벽 2시: 로그 정리"
echo "  - 매주 일요일 새벽 3시: 전체 점검"

# 5. cron 서비스 상태 확인
if systemctl is-active --quiet crond; then
    log_info "✅ cron 서비스 정상 동작 중"
else
    log_warn "⚠️  cron 서비스 시작 중..."
    sudo systemctl start crond
fi

log_info "설정 완료! 로그는 /var/log/visitkorea-*.log 에서 확인할 수 있습니다."
