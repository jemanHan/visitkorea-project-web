# 🪟 Windows 팀원용 빠른 설치 가이드

Windows 환경에서 VisitKorea 프로젝트를 빠르게 설정하는 방법입니다.

## 🚀 1분 설치 (Windows 전용)

### 1단계: Docker Desktop 설치
1. [Docker Desktop for Windows 다운로드](https://docs.docker.com/desktop/install/windows-install/)
2. 설치 후 **Docker Desktop 실행** (시스템 트레이에 고래 아이콘 확인)
3. **WSL 2 백엔드 활성화** (설정 > General > Use WSL 2)

### 2단계: 프로젝트 실행
```bash
# Git Bash 또는 PowerShell에서 실행
git clone https://github.com/jemanHan/visitkorea-project-web.git
cd visitkorea-project-web
./scripts/setup-docker.sh
```

### 3단계: 접속
- **프론트엔드**: http://localhost:5173
- **백엔드**: http://localhost:3002

## ⚠️ Windows 주의사항

### 필수 요구사항
- ✅ **Windows 10/11** (WSL 2 지원)
- ✅ **Docker Desktop 실행 중**
- ✅ **Git Bash 또는 PowerShell** 사용
- ✅ **관리자 권한** (필요시)

### 문제 해결
```bash
# Docker 상태 확인
docker --version
docker-compose --version

# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f frontend
```

### 포트 충돌 해결
```bash
# PowerShell에서 포트 사용 확인
netstat -ano | findstr :5173
netstat -ano | findstr :3002
netstat -ano | findstr :5432

# 기존 서비스 종료 후 재시작
docker-compose down
docker-compose up -d
```

## 🎯 Google Maps 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. API 키 설정에서 **HTTP 리퍼러** 추가:
   - `http://localhost:5173/*`
   - `http://127.0.0.1:5173/*`
3. 컨테이너 재시작: `docker-compose restart frontend`

## 🛠️ 개발 명령어

```bash
# 서비스 재시작
docker-compose restart backend
docker-compose restart frontend

# 실시간 로그
docker-compose logs -f frontend
docker-compose logs -f backend

# 완전 중지
docker-compose down

# 데이터까지 삭제
docker-compose down -v
```

## 📞 도움말

**문제가 발생하면:**
1. Docker Desktop이 실행 중인지 확인
2. WSL 2가 활성화되어 있는지 확인
3. 방화벽에서 Docker 허용
4. `docker-compose logs`로 오류 확인

**🎉 이제 Windows에서도 EC2와 동일한 환경으로 개발할 수 있습니다!**
