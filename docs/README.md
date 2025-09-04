# 📚 VisitKorea 프로젝트 문서

## 📋 문서 개요
이 폴더는 VisitKorea 프로젝트의 모든 문서를 포함합니다.

## 📖 문서 목록

### 📚 통합 가이드
- **[완전 가이드](./COMPLETE_GUIDE.md)** - **모든 것을 포함한 통합 가이드** 📚

### ☁️ AWS 인프라
- **[AWS 서버 분리 가이드](./AWS_Web_WAS_Server_Separation_Guide.md)** - AWS 인프라 설정 및 서버 분리 가이드

## 🎯 문서 사용 가이드

### 처음 시작하는 경우 (새로운 팀원)
1. **[완전 가이드](./COMPLETE_GUIDE.md)** - **모든 것을 포함한 통합 가이드** 📚

### AWS 인프라 설정
1. **[AWS 서버 분리 가이드](./AWS_Web_WAS_Server_Separation_Guide.md)** - AWS 환경 설정

## 🔧 빠른 참조

### 자주 사용하는 명령어
```bash
# 환경 설정
./scripts/setup-env.sh [WAS_IP]

# 상태 확인
./scripts/health-check.sh

# 자동 복구
./scripts/auto-recovery.sh

# 정기 모니터링 설정
./scripts/setup-cron.sh
```

### 로그 파일 위치
- `/var/log/visitkorea-health.log` - 헬스체크 로그
- `/var/log/visitkorea-recovery.log` - 자동 복구 로그
- `/var/log/nginx/error.log` - nginx 에러 로그
- `/var/log/nginx/access.log` - nginx 접근 로그

## 📞 지원

문제가 발생하면 다음 순서로 해결하세요:

1. **[완전 가이드](./COMPLETE_GUIDE.md)** 확인
2. 자동화 스크립트 실행
3. 로그 파일 확인
4. 필요시 수동 설정 확인

---

**💡 팁:** 각 문서는 독립적으로 읽을 수 있지만, 순서대로 읽으면 더 효과적입니다.
