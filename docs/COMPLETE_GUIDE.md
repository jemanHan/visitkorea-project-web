# 🚀 VisitKorea 프로젝트 완전 가이드

## 📋 개요
이 가이드는 VisitKorea 프로젝트를 처음부터 끝까지 완전히 설정하고 운영하는 방법을 설명합니다.

## 🏗️ 시스템 아키텍처
```
[사용자] → [웹 서버 (nginx)] → [WAS 서버 (API)] → [데이터베이스]
```

- **웹 서버**: nginx (포트 80) - 프론트엔드 서빙
- **WAS 서버**: Node.js API 서버 (포트 3002) - 백엔드 API
- **데이터베이스**: PostgreSQL - 데이터 저장
- **자동화**: 스크립트 기반 설정 관리 및 모니터링

## 🚀 1단계: 프로젝트 클론 및 초기 설정

### 1.1 프로젝트 클론
```bash
git clone [저장소-URL]
cd visitkorea-project
```

### 1.2 자동 초기 설정 실행
```bash
# 모든 초기 설정을 자동으로 수행
./scripts/setup-team.sh
```

**이 스크립트가 자동으로 수행하는 작업:**
- Node.js/npm 버전 확인
- 의존성 자동 설치
- 환경 변수 파일 자동 생성
- 스크립트 실행 권한 자동 설정
- 프론트엔드 빌드 테스트
- nginx 설치 확인
- Git 설정 확인

### 1.3 API 서버 설정
```bash
# .env 파일에서 API 서버 IP 설정
nano .env
```

**API 서버 설정 옵션:**
```bash
# 로컬 개발 서버 (백엔드도 로컬에서 실행하는 경우)
VITE_API_BASE_URL=http://localhost:3002

# 팀원의 서버
VITE_API_BASE_URL=http://192.168.1.100:3002

# 프로덕션 서버
VITE_API_BASE_URL=http://13.209.108.148:3002

# 당신의 EC2 서버
VITE_API_BASE_URL=http://your-ec2-ip:3002
```

## 🛠️ 2단계: 개발 환경 설정

### 2.1 필수 요구사항
- **Node.js**: 18.x 이상
- **npm**: 8.x 이상
- **Git**: 최신 버전
- **nginx**: 프로덕션 배포 시 필요

### 2.2 운영체제별 설치 방법

#### Ubuntu/Debian
```bash
# Node.js 및 npm 설치
sudo apt update
sudo apt install nodejs npm

# nginx 설치 (프로덕션 배포 시)
sudo apt install nginx

# Git 설치
sudo apt install git
```

#### CentOS/RHEL
```bash
# Node.js 및 npm 설치
sudo yum install nodejs npm

# nginx 설치 (프로덕션 배포 시)
sudo yum install nginx

# Git 설치
sudo yum install git
```

#### macOS
```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 및 npm 설치
brew install node

# nginx 설치 (프로덕션 배포 시)
brew install nginx

# Git 설치
brew install git
```

#### Windows
1. [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전 다운로드 및 설치
2. [Git for Windows](https://git-scm.com/download/win) 다운로드 및 설치
3. PowerShell 또는 Command Prompt에서 프로젝트 클론

### 2.3 개발 서버 실행
```bash
# 프론트엔드 개발 서버 실행
cd apps/frontend
npm run dev

# 또는 루트에서 실행
npm run dev
```

## 🔄 3단계: API 서버 전환 (팀원들이 자주 사용)

### 3.1 API 서버 전환 스크립트 사용 (가장 쉬움!)
```bash
# 특정 WAS 서버 IP로 자동 전환
./scripts/switch-api.sh 192.168.1.100

# 사전 정의된 서버 사용
./scripts/switch-api.sh local    # localhost:3002
./scripts/switch-api.sh dev      # 개발 서버
./scripts/switch-api.sh prod     # 프로덕션 서버

# 연결 테스트만 수행
./scripts/switch-api.sh 192.168.1.100 --test

# 빌드 없이 설정만 변경
./scripts/switch-api.sh 192.168.1.100 --no-build
```

### 3.2 수동 설정 방법
```bash
# .env 파일 직접 편집
nano .env

# VITE_API_BASE_URL을 원하는 서버로 변경
VITE_API_BASE_URL=http://your-server-ip:3002

# 프론트엔드 재빌드
cd apps/frontend
npm run build
cd ../..
```

## 🚀 4단계: 프로덕션 배포

### 4.1 환경 설정 자동화
```bash
# WAS 서버 IP로 자동 설정
./scripts/setup-env.sh 13.209.108.148

# 이 명령어가 자동으로 수행하는 작업:
# - 환경 변수 파일 업데이트
# - nginx 설정 업데이트
# - 프론트엔드 빌드 및 배포
# - 연결 테스트
```

### 4.2 nginx 설정 확인
```bash
# nginx 설정 테스트
sudo nginx -t

# nginx 재시작
sudo systemctl restart nginx

# nginx 상태 확인
sudo systemctl status nginx
```

### 4.3 배포 확인
```bash
# 연결 상태 확인
./scripts/health-check.sh

# 브라우저에서 확인
curl http://localhost/v1/health
```

## 🔍 5단계: 모니터링 및 문제 해결

### 5.1 자동 모니터링 설정
```bash
# 정기 모니터링 설정
./scripts/setup-cron.sh

# 설정되는 작업:
# - 매 5분: 헬스체크 실행
# - 매 30분: 자동 복구 시도
# - 매일 새벽 2시: 로그 정리
# - 매주 일요일 새벽 3시: 전체 점검
```

### 5.2 문제 발생 시 자동 복구
```bash
# 자동 복구 실행
./scripts/auto-recovery.sh

# 복구 후 상태 확인
./scripts/health-check.sh
```

### 5.3 수동 문제 해결

#### 자주 발생하는 문제들

**1. WAS 서버 연결 실패**
```bash
# 해결 방법
./scripts/auto-recovery.sh

# WAS 서버 상태 확인 (WAS 서버에서 실행)
sudo systemctl status [was-service-name]
sudo netstat -tlnp | grep :3002
```

**2. nginx 설정 오류**
```bash
# 해결 방법
sudo nginx -t
./scripts/setup-env.sh [WAS_IP]
```

**3. 환경 변수 파일 없음**
```bash
# 해결 방법
cp .env.example .env
# 또는
./scripts/auto-recovery.sh
```

**4. 스크립트 실행 권한 오류**
```bash
# 해결 방법
chmod +x scripts/*.sh
```

## 📊 6단계: 로그 및 모니터링

### 6.1 로그 파일 위치
- `/var/log/visitkorea-health.log` - 헬스체크 로그
- `/var/log/visitkorea-recovery.log` - 자동 복구 로그
- `/var/log/nginx/error.log` - nginx 에러 로그
- `/var/log/nginx/access.log` - nginx 접근 로그

### 6.2 로그 확인 방법
```bash
# 실시간 로그 확인
tail -f /var/log/visitkorea-health.log

# 최근 에러 확인
grep "ERROR" /var/log/visitkorea-*.log

# nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log
```

## 🎯 7단계: 팀 협업

### 7.1 API 서버 공유 및 관리
- **각자 자신의 WAS 서버 사용**: 팀원마다 다른 API 서버 IP 사용 가능
- **서버 IP 공유**: 팀원들 간에 사용 가능한 WAS 서버 IP 공유
- **환경 변수 관리**: `.env` 파일은 git에 커밋하지 않음

### 7.2 팀원별 API 서버 설정 예시
```bash
# 팀원 A (프론트엔드 개발자)
VITE_API_BASE_URL=http://192.168.1.100:3002  # 팀원 B의 WAS 서버 사용

# 팀원 B (백엔드 개발자)  
VITE_API_BASE_URL=http://localhost:3002       # 자신의 로컬 WAS 서버 사용

# 팀원 C (풀스택 개발자)
VITE_API_BASE_URL=http://13.209.108.148:3002   # 프로덕션 서버 사용

# 팀원 D (테스터)
VITE_API_BASE_URL=http://192.168.1.101:3002  # 테스트 서버 사용
```

### 7.3 브랜치 전략
```bash
# 메인 브랜치
main                    # 프로덕션 배포용
develop                 # 개발 통합용

# 기능 브랜치
feature/user-auth       # 사용자 인증 기능
feature/search-improve  # 검색 기능 개선
bugfix/login-error      # 로그인 오류 수정
```

## 🆘 8단계: 지원 및 문제 해결

### 8.1 문제 발생 시 해결 순서
1. **자동 진단 실행**
   ```bash
   ./scripts/health-check.sh
   ```

2. **자동 복구 시도**
   ```bash
   ./scripts/auto-recovery.sh
   ```

3. **로그 파일 확인**
   ```bash
   tail -f /var/log/visitkorea-health.log
   ```

4. **수동 설정 확인**
   ```bash
   sudo nginx -t
   cat .env
   ```

### 8.2 유용한 명령어 모음
```bash
# 프로젝트 상태 확인
./scripts/health-check.sh

# API 서버 전환
./scripts/switch-api.sh [서버IP]

# 환경 설정
./scripts/setup-env.sh [WAS_IP]

# 자동 복구
./scripts/auto-recovery.sh

# 정기 모니터링 설정
./scripts/setup-cron.sh

# nginx 상태 확인
sudo systemctl status nginx

# nginx 설정 테스트
sudo nginx -t

# nginx 재시작
sudo systemctl restart nginx
```

## 📁 프로젝트 구조
```
visitkorea-project/
├── apps/
│   └── frontend/          # 프론트엔드 (React + Vite)
├── packages/
│   ├── adapters/          # 외부 API 어댑터
│   ├── application/       # 애플리케이션 로직
│   ├── domain/           # 도메인 모델
│   └── shared-types/     # 공유 타입 정의
├── scripts/              # 자동화 스크립트
│   ├── setup-team.sh     # 팀원용 초기 설정
│   ├── switch-api.sh     # API 서버 전환
│   ├── setup-env.sh      # 환경 설정 자동화
│   ├── health-check.sh   # 헬스체크 모니터링
│   ├── auto-recovery.sh  # 자동 복구 시스템
│   └── setup-cron.sh     # 정기 모니터링 설정
├── docs/                 # 문서
├── .env.example          # 환경 변수 예시
├── .env                  # 실제 환경 변수 (자동 생성)
└── README.md             # 프로젝트 개요
```

## 🎉 완료!

이제 VisitKorea 프로젝트를 완전히 설정하고 운영할 수 있습니다!

### 주요 장점
- **⚡ 빠른 설정**: 자동화 스크립트로 초기 설정 완료
- **🔄 쉬운 전환**: API 서버 전환을 한 번의 명령어로
- **🛡️ 자동 복구**: 문제 발생 시 자동으로 복구 시도
- **📊 모니터링**: 정기적인 상태 확인 및 로그 관리
- **👥 팀 협업**: 각자 다른 서버 사용 가능

---

**💡 팁:** 모든 스크립트는 실행 권한이 필요합니다. 권한이 없다면 `chmod +x scripts/*.sh`를 실행하세요.
