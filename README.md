# 🇰🇷 VisitKorea 프로젝트

## 📋 프로젝트 개요
VisitKorea는 한국 관광지 정보를 제공하는 웹 애플리케이션입니다. 웹 서버와 WAS 서버가 분리된 구조로 운영되며, 자동화된 배포 및 관리 시스템을 갖추고 있습니다.

## 🏗️ 시스템 아키텍처
```
[사용자] → [웹 서버 (nginx)] → [WAS 서버 (API)]
```

- **웹 서버**: nginx (포트 80)
- **WAS 서버**: Node.js API 서버 (포트 3002)
- **데이터베이스**: PostgreSQL
- **자동화**: 스크립트 기반 설정 관리 및 모니터링

## 🚀 빠른 시작

### 👥 새로운 팀원인 경우
```bash
# 1. 프로젝트 클론
git clone [저장소-URL]
cd visitkorea-project

# 2. 자동 설정 실행
./scripts/setup-team.sh

# 3. API 서버 설정 (각자 자신의 서버 사용)
nano .env  # VITE_API_BASE_URL을 원하는 서버 IP로 변경
```

#### 🔧 API 서버 설정 옵션
- **로컬 개발**: `VITE_API_BASE_URL=http://localhost:3002`
- **팀원 서버**: `VITE_API_BASE_URL=http://팀원-IP:3002`
- **프로덕션**: `VITE_API_BASE_URL=http://13.209.108.148:3002`
- **자신의 서버**: `VITE_API_BASE_URL=http://your-ip:3002`

### 🔧 기존 팀원인 경우
```bash
# 1. 환경 설정
./scripts/setup-env.sh 13.209.108.148

# 2. 상태 확인
./scripts/health-check.sh

# 3. 문제 발생 시
./scripts/auto-recovery.sh
```

## 🛠️ 자동화 스크립트

### 📁 scripts/ 디렉토리
- `setup-team.sh` - **팀원용 초기 설정** (새로운 팀원 필수)
- `switch-api.sh` - **API 서버 전환** (팀원들이 자주 사용)
- `setup-env.sh` - 환경 설정 자동화
- `health-check.sh` - 헬스체크 모니터링
- `auto-recovery.sh` - 자동 복구 시스템
- `setup-cron.sh` - 정기 모니터링 설정

### 🔧 주요 기능

#### 1. 환경 설정 자동화 (`setup-env.sh`)
```bash
./scripts/setup-env.sh [WAS_SERVER_IP]
```
**기능:**
- 환경 변수 파일 자동 생성
- nginx 설정 자동 업데이트
- 프론트엔드 자동 빌드 및 배포
- 연결 테스트 자동 실행

#### 2. 헬스체크 모니터링 (`health-check.sh`)
```bash
./scripts/health-check.sh [WAS_SERVER_IP]
```
**확인 항목:**
- 네트워크 연결 상태
- 포트 연결 상태
- HTTP 헬스체크
- nginx 서비스 상태
- 환경 변수 설정
- 에러 로그 확인

#### 3. 자동 복구 시스템 (`auto-recovery.sh`)
```bash
./scripts/auto-recovery.sh
```
**복구 기능:**
- nginx 서비스 자동 재시작
- 설정 파일 자동 복구
- 환경 변수 파일 자동 생성
- 프론트엔드 자동 재배포
- 로그 파일 정리

#### 4. 정기 모니터링 설정 (`setup-cron.sh`)
```bash
./scripts/setup-cron.sh
```
**설정되는 작업:**
- 매 5분: 헬스체크 실행
- 매 30분: 자동 복구 시도
- 매일 새벽 2시: 로그 정리
- 매주 일요일 새벽 3시: 전체 점검

## 📁 프로젝트 구조
```
visitkorea-project/
├── apps/
│   └── frontend/          # 프론트엔드 (Vite + React)
├── packages/
│   ├── adapters/          # 외부 API 어댑터
│   ├── application/       # 애플리케이션 로직
│   ├── domain/           # 도메인 모델
│   └── shared-types/     # 공유 타입 정의
├── scripts/              # 자동화 스크립트
│   ├── setup-env.sh      # 환경 설정 자동화
│   ├── health-check.sh   # 헬스체크 모니터링
│   ├── auto-recovery.sh  # 자동 복구 시스템
│   └── setup-cron.sh     # 정기 모니터링 설정
├── docs/                 # 📚 문서
│   ├── AUTOMATION_GUIDE.md      # 자동화 시스템 가이드
│   ├── DEPLOYMENT_GUIDE.md      # 배포 가이드
│   ├── TROUBLESHOOTING.md       # 문제 해결 가이드
│   └── AWS_Web_WAS_Server_Separation_Guide.md  # AWS 서버 분리 가이드
├── .env.example          # 환경 변수 예시
├── .env                  # 실제 환경 변수 (자동 생성)
└── README.md             # 이 파일
```

## 🔄 일반적인 사용 시나리오

### 시나리오 1: WAS 서버 IP 변경
```bash
# 1. 새로운 IP로 환경 설정
./scripts/setup-env.sh 192.168.1.100

# 2. 연결 상태 확인
./scripts/health-check.sh 192.168.1.100
```

### 시나리오 2: 시스템 문제 발생 시
```bash
# 1. 자동 복구 시도
./scripts/auto-recovery.sh

# 2. 복구 후 상태 확인
./scripts/health-check.sh
```

### 시나리오 3: 정기 점검
```bash
# 1. 전체 시스템 상태 확인
./scripts/health-check.sh

# 2. 필요시 자동 복구
./scripts/auto-recovery.sh
```

## 🚨 문제 해결

### 자주 발생하는 문제들

1. **WAS 서버 연결 실패**
   ```bash
   # 해결 방법
   ./scripts/auto-recovery.sh
   ```

2. **nginx 설정 오류**
   ```bash
   # 해결 방법
   sudo nginx -t
   ./scripts/setup-env.sh [WAS_IP]
   ```

3. **환경 변수 파일 없음**
   ```bash
   # 해결 방법
   cp .env.example .env
   # 또는
   ./scripts/auto-recovery.sh
   ```

## 📊 모니터링 로그

### 로그 파일 위치
- `/var/log/visitkorea-health.log` - 헬스체크 로그
- `/var/log/visitkorea-recovery.log` - 자동 복구 로그
- `/var/log/nginx/error.log` - nginx 에러 로그
- `/var/log/nginx/access.log` - nginx 접근 로그

### 로그 확인 방법
```bash
# 실시간 로그 확인
tail -f /var/log/visitkorea-health.log

# 최근 에러 확인
grep "ERROR" /var/log/visitkorea-*.log
```

## 🔧 수동 설정 (비상시)

### nginx 설정 수동 변경
```bash
sudo nano /etc/nginx/conf.d/visitkorea.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 환경 변수 수동 설정
```bash
nano .env
# VITE_API_BASE_URL=http://[WAS_IP]:3002
```

## 📞 지원

문제가 발생하면 다음 순서로 해결하세요:

1. `./scripts/health-check.sh` 실행
2. `./scripts/auto-recovery.sh` 실행
3. 로그 파일 확인
4. 수동 설정 확인

## 🎯 주요 개선사항

### 자동화 시스템 도입 전
- ❌ IP 변경 시 수동으로 여러 파일 수정
- ❌ 문제 발생 시 하나씩 수동 확인
- ❌ 정기 점검을 수동으로 수행
- ❌ 설정 오류 시 복구 시간 오래 소요

### 자동화 시스템 도입 후
- ✅ IP 변경 시 한 번의 명령어로 모든 설정 변경
- ✅ 문제 발생 시 자동 진단 및 복구
- ✅ cron으로 정기 모니터링 자동 실행
- ✅ 설정 오류 시 자동 복구

---

## 📚 관련 문서

### 📖 상세 가이드
- **[팀원 설정 가이드](./docs/TEAM_SETUP_GUIDE.md)** - **새로운 팀원 필수** 📚
- **[자동화 시스템 가이드](./docs/AUTOMATION_GUIDE.md)** - 자동화 스크립트 상세 설명
- **[배포 가이드](./docs/DEPLOYMENT_GUIDE.md)** - 배포 및 설정 가이드
- **[문제 해결 가이드](./docs/TROUBLESHOOTING.md)** - 문제 진단 및 해결 방법
- **[AWS 서버 분리 가이드](./docs/AWS_Web_WAS_Server_Separation_Guide.md)** - AWS 인프라 설정 가이드

### 🚀 빠른 참조
- **API 서버 전환**: `./scripts/switch-api.sh [서버IP]` (팀원들이 자주 사용)
- **환경 설정**: `./scripts/setup-env.sh [WAS_IP]`
- **상태 확인**: `./scripts/health-check.sh`
- **자동 복구**: `./scripts/auto-recovery.sh`
- **정기 모니터링**: `./scripts/setup-cron.sh`

---

**💡 팁:** 모든 스크립트는 실행 권한이 필요합니다. 권한이 없다면 `chmod +x scripts/*.sh`를 실행하세요.
