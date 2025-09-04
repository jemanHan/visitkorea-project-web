# AWS 웹서버와 WAS 서버 분리 가이드

## 📋 개요

이 문서는 AWS EC2에서 웹서버와 WAS(Web Application Server)를 분리하여 구축하는 전체 과정을 설명합니다.

**목표**: 단일 서버에서 실행되던 웹 애플리케이션을 두 개의 독립적인 서버로 분리
- **웹서버**: 프론트엔드 호스팅 + API 프록시
- **WAS 서버**: 백엔드 API + 데이터베이스

## 🏗️ 아키텍처 설계

### 서버 구성
```
┌─────────────────┐    ┌─────────────────┐
│   웹서버        │    │   WAS 서버      │
│   (Public)      │    │   (Public)      │
│                 │    │                 │
│ • Nginx         │◄──►│ • Node.js       │
│ • Frontend      │    │ • Fastify API   │
│ • API Proxy     │    │ • PostgreSQL    │
│                 │    │ • tmux          │
└─────────────────┘    └─────────────────┘
```

### 네트워크 구성
- **웹서버**: 3.38.189.87 (Public IP)
- **WAS 서버**: 3.38.252.162 (Public IP)
- **통신**: 웹서버 → WAS 서버 (포트 3002)

## 🚀 단계별 구현 가이드

### 1단계: WAS 서버 생성 및 기본 설정

#### 1.1 EC2 인스턴스 생성
- **인스턴스 타입**: t3.medium (2 vCPU, 4GB RAM)
- **AMI**: Amazon Linux 2023
- **보안 그룹**: `visitkorea-was-sg-2025`
- **태그**: `visitkorea-was-server-2025`

#### 1.2 기본 환경 설정
```bash
# 시스템 업데이트
sudo yum update -y

# Node.js 20 설치
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Docker 설치
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Git 설치
sudo yum install -y git

# tmux 설치
sudo yum install -y tmux
```

#### 1.3 프로젝트 구조 생성
```bash
mkdir -p ~/visitkorea-project
cd ~/visitkorea-project
npm init -y
```

### 2단계: WAS 서버 보안 그룹 설정

#### 2.1 AWS 콘솔에서 보안 그룹 설정
**보안 그룹**: `visitkorea-was-sg-2025`

**인바운드 규칙**:
| 유형 | 프로토콜 | 포트 범위 | 소스 | 설명 |
|------|----------|-----------|------|------|
| SSH | TCP | 22 | 59.10.24.82/32 | 개발자 IP |
| HTTP | TCP | 80 | sg-0018f027d92139437 | 웹서버 보안 그룹 |
| HTTPS | TCP | 443 | sg-0018f027d92139437 | 웹서버 보안 그룹 |
| PostgreSQL | TCP | 5432 | sg-0018f027d92139437 | 웹서버 보안 그룹 |
| **사용자 지정 TCP** | **TCP** | **3002** | **0.0.0.0/0** | **백엔드 API** |

### 3단계: WAS 서버에 백엔드 배포

#### 3.1 프로젝트 클론
```bash
cd ~/visitkorea-project
git clone <your-repository-url> .
```

#### 3.2 의존성 설치
```bash
npm install
```

#### 3.3 환경 변수 설정
```bash
# .env.local 파일 생성
cat > .env.local << EOF
# Google Places API
GOOGLE_PLACES_BACKEND_KEY=your_google_places_api_key_here

# JWT
JWT_SECRET=your_jwt_secret_here

# AWS Cognito
COGNITO_USER_POOL_ID=your_cognito_user_pool_id
COGNITO_CLIENT_ID=your_cognito_client_id
COGNITO_REGION=ap-northeast-2

# Database
DATABASE_URL=postgresql://vk:vk123456@localhost:5432/vk

# Cache TTL (milliseconds)
DETAIL_TTL_MS=604800000
EOF
```

#### 3.4 백엔드 서비스 실행
```bash
# tmux 세션 생성
tmux new-session -d -s backend

# tmux 세션에 접속
tmux attach -t backend

# 백엔드 서비스 시작
cd apps/backend
npm run dev

# tmux 세션 분리 (Ctrl+B, D)
```

#### 3.5 백엔드 서비스 자동 시작 설정
```bash
# systemd 서비스 파일 생성
sudo tee /etc/systemd/system/visitkorea-backend.service << EOF
[Unit]
Description=VisitKorea Backend Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/visitkorea-project/apps/backend
ExecStart=/usr/bin/node dist/local.mjs
Environment=NODE_ENV=production
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable visitkorea-backend
sudo systemctl start visitkorea-backend
```

### 4단계: 웹서버에서 백엔드 제거

#### 4.1 백엔드 프로세스 중지
```bash
# 실행 중인 백엔드 프로세스 확인
ps aux | grep -E "(node|tsx|backend)" | grep -v grep

# 프로세스 중지 (필요시)
sudo pkill -f "node.*backend"
```

#### 4.2 백엔드 관련 파일 제거
```bash
cd /home/ec2-user/visitkorea-project

# 백엔드 디렉토리 제거
rm -rf apps/backend

# 데이터베이스 관련 디렉토리 제거
rm -rf packages/db

# Docker 관련 파일 제거
rm -f docker-compose.yml docker-compose.prod.yml
rm -f env.example README-Docker.md

# 인프라 코드 제거
rm -rf apps/infra

# 예시 파일 제거
rm -rf exam
```

#### 4.3 현재 디렉토리 구조 확인
```bash
ls -la
ls -la apps/
```

**예상 결과**:
```
apps/
├── frontend/          # 프론트엔드 파일들
packages/
├── adapters/          # 어댑터 패턴
├── application/       # 애플리케이션 로직
├── domain/           # 도메인 모델
└── shared-types/     # 공통 타입 정의
```

### 5단계: 웹서버 Nginx 설정 변경

#### 5.1 기존 설정 백업
```bash
sudo cp /etc/nginx/conf.d/visitkorea.conf /etc/nginx/conf.d/visitkorea.conf.backup
```

#### 5.2 프록시 설정 변경
```bash
# WAS 서버 IP로 프록시 설정 변경
sudo sed -i 's|http://127.0.0.1:3002|http://3.38.252.162:3002|g' /etc/nginx/conf.d/visitkorea.conf
```

#### 5.3 변경된 설정 확인
```bash
sudo cat /etc/nginx/conf.d/visitkorea.conf
```

**예상 결과**:
```nginx
server {
    listen 80 default_server;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /v1/ {
        proxy_pass http://3.38.252.162:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5.4 Nginx 설정 검증 및 재시작
```bash
# 설정 문법 검증
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx

# 상태 확인
sudo systemctl status nginx
```

### 6단계: 연결 테스트

#### 6.1 WAS 서버 직접 연결 테스트
```bash
# 웹서버에서 WAS 서버 연결 테스트
curl -v http://3.38.252.162:3002/health
```

**예상 결과**: HTTP 200 OK, `{"ok":true}`

#### 6.2 Nginx 프록시 테스트
```bash
# 웹서버에서 Nginx를 통한 프록시 테스트
curl -v http://localhost/v1/health
```

**예상 결과**: HTTP 200 OK, `{"ok":true}`

#### 6.3 다른 API 엔드포인트 테스트
```bash
# 검색 API 테스트
curl http://localhost/v1/search

# 장소 상세 API 테스트
curl http://localhost/v1/places/ChIJsQyUpikicjURqEWP9-ULGD4
```

## 🔧 문제 해결 가이드

### 연결 실패 시 확인사항

#### 1. 보안 그룹 설정 확인
- WAS 서버 보안 그룹에 포트 3002가 열려있는지 확인
- 소스가 올바르게 설정되어 있는지 확인

#### 2. 백엔드 서비스 상태 확인
```bash
# WAS 서버에서
ps aux | grep node
sudo netstat -tlnp | grep :3002
```

#### 3. 방화벽 설정 확인
```bash
# WAS 서버에서
sudo ufw status
sudo ufw allow 3002
```

#### 4. Nginx 로그 확인
```bash
# 웹서버에서
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 일반적인 오류 및 해결방법

#### Connection Refused
- 백엔드 서비스가 실행되지 않음
- 포트 3002가 올바르게 바인딩되지 않음
- 방화벽에서 포트 차단

#### 404 Not Found
- API 경로가 올바르게 등록되지 않음
- Nginx 프록시 설정 오류

#### Timeout
- 보안 그룹에서 포트 차단
- 네트워크 연결 문제

## 📊 최종 서버 구성

### 웹서버 (3.38.189.87)
**역할**: 프론트엔드 호스팅 + API 프록시
**구성요소**:
- Nginx (정적 파일 서빙)
- React 빌드 파일
- API 프록시 설정
- 공통 패키지들

**제거된 항목**:
- 백엔드 애플리케이션
- 데이터베이스 관련 코드
- 인프라 코드
- Docker 설정

### WAS 서버 (3.38.252.162)
**역할**: 백엔드 API + 데이터베이스
**구성요소**:
- Node.js + Fastify
- PostgreSQL 데이터베이스
- 환경 변수 및 보안 설정
- tmux 세션 관리

## 🚀 운영 및 유지보수

### 백엔드 서비스 관리
```bash
# tmux 세션 관리
tmux list-sessions
tmux attach -t backend
tmux kill-session -t backend

# systemd 서비스 관리
sudo systemctl status visitkorea-backend
sudo systemctl restart visitkorea-backend
sudo systemctl stop visitkorea-backend
```

### 로그 모니터링
```bash
# 백엔드 로그 확인
tail -f ~/visitkorea-project/apps/backend/backend.log

# Nginx 로그 확인
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 백업 및 복구
```bash
# 설정 파일 백업
sudo cp /etc/nginx/conf.d/visitkorea.conf ~/nginx-backup/
sudo cp /etc/systemd/system/visitkorea-backend.service ~/systemd-backup/

# 환경 변수 백업
cp ~/visitkorea-project/.env.local ~/env-backup/
```

## 📝 체크리스트

### WAS 서버 설정
- [ ] EC2 인스턴스 생성 (t3.medium)
- [ ] Node.js 20 설치
- [ ] Docker 설치
- [ ] 보안 그룹 설정 (포트 3002)
- [ ] 프로젝트 클론 및 의존성 설치
- [ ] 환경 변수 설정
- [ ] 백엔드 서비스 실행
- [ ] tmux 세션 설정

### 웹서버 정리
- [ ] 백엔드 프로세스 중지
- [ ] 백엔드 관련 파일 제거
- [ ] 인프라 코드 제거
- [ ] 불필요한 파일 제거
- [ ] Nginx 설정 변경
- [ ] 연결 테스트

### 최종 검증
- [ ] 웹서버 → WAS 서버 직접 연결
- [ ] Nginx 프록시 정상 작동
- [ ] API 엔드포인트 정상 응답
- [ ] 서버 역할 분리 완료

## 🎯 성공 지표

- ✅ 웹서버에서 백엔드 관련 파일 완전 제거
- ✅ WAS 서버에서 백엔드 API 정상 실행
- ✅ Nginx 프록시를 통한 API 요청 정상 처리
- ✅ 두 서버 간 안정적인 통신
- ✅ 각 서버의 역할 명확한 분리

---

**참고**: 이 가이드는 AWS EC2 환경에서 Node.js + Fastify 기반의 백엔드와 React 프론트엔드를 분리하는 과정을 다룹니다. 환경에 따라 일부 설정이 다를 수 있습니다.
