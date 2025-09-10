# 🔗 WAS-Web 통합 서버 연동 가이드

## 📋 개요

**개발 단계**: WAS(백엔드) + Web(프론트엔드)를 **같은 서버**에서 운영  
**운영 단계**: 필요시 **분리 서버**로 확장 가능  
**통신 방식**: **API 기반** 통신으로 일관성 유지

---

## 🏗️ 서버 구조

### **통합 서버 아키텍처**
```
통합 서버 (13.209.108.148)
├── Web Server (nginx:80)
│   ├── 정적 파일 서빙 (/usr/share/nginx/html)
│   └── API 프록시 (/v1/* → localhost:3002)
└── WAS Server (Node.js:3002)
    ├── API 엔드포인트 (/v1/*)
    ├── 데이터베이스 연결 (PostgreSQL:5432)
    └── 비즈니스 로직
```

### **폴더 구조**
```
/home/ec2-user/visitkorea-project/
├── apps/
│   ├── frontend/     # Web 프론트엔드 코드
│   └── backend/      # WAS 백엔드 코드 (향후 추가)
├── dist/             # 빌드된 프론트엔드 파일들
└── .env              # 통합 환경 변수
```

---

## ⚠️ 연동 시 주의사항

### **1. 포트 관리**

#### **포트 할당**
- **80**: nginx (Web 서버)
- **3002**: Node.js (WAS 서버)  
- **5432**: PostgreSQL (데이터베이스)

#### **포트 충돌 방지**
```bash
# 포트 사용 상태 확인
sudo netstat -tlnp | grep -E ':(80|3002|5432)'

# 특정 포트 점유 프로세스 확인
sudo lsof -i :3002
```

#### **방화벽 설정**
```bash
# 필요한 포트만 열기
sudo ufw allow 80/tcp      # Web 서버
sudo ufw allow 3002/tcp    # WAS 서버 (개발용)
sudo ufw allow 5432/tcp    # DB (내부 통신용)
```

### **2. 환경 변수 설정**

#### **통합 서버용 환경 변수**
```bash
# /home/ec2-user/visitkorea-project/.env
VITE_API_BASE_URL=http://13.209.108.148:3002
NODE_ENV=production

# WAS 서버용 (향후 추가)
DATABASE_URL=postgresql://vk:vk123456@localhost:5432/vk
JWT_SECRET=your_jwt_secret_key
GOOGLE_PLACES_BACKEND_KEY=your_google_api_key
PORT=3002
```

#### **환경별 설정 파일**
```bash
# 개발 환경
apps/frontend/.env.local    # 로컬 개발용
apps/backend/.env.local     # WAS 로컬 개발용

# 통합 서버 환경  
apps/frontend/.env          # Web 서버용
apps/backend/.env           # WAS 서버용

# Docker 환경 (향후 분리 시)
apps/frontend/.env.docker
apps/backend/.env.docker
```

### **3. nginx 프록시 설정**

#### **API 프록시 규칙**
```nginx
# /etc/nginx/conf.d/visitkorea.conf
server {
    listen 80 default_server;
    server_name _;
    
    # 정적 파일 서빙
    root /usr/share/nginx/html;
    index index.html;
    
    # SPA 라우팅 처리
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 프록시 (중요!)
    location /v1/ {
        proxy_pass http://localhost:3002;  # 통합 서버에서는 localhost
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 헤더 (필요시)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # 타임아웃 설정
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

### **4. 데이터베이스 연결**

#### **PostgreSQL 설정**
```bash
# 데이터베이스 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U vk -d vk -c "SELECT version();"
```

#### **연결 문자열**
```bash
# 통합 서버에서는 localhost 사용
DATABASE_URL=postgresql://vk:vk123456@localhost:5432/vk

# 분리 서버에서는 IP 지정
DATABASE_URL=postgresql://vk:vk123456@13.209.108.148:5432/vk
```

### **5. 프로세스 관리**

#### **PM2를 이용한 WAS 서버 관리**
```bash
# WAS 서버 시작
pm2 start apps/backend/server.js --name "visitkorea-was"

# 상태 확인
pm2 status

# 로그 확인
pm2 logs visitkorea-was

# 재시작
pm2 restart visitkorea-was
```

#### **nginx 관리**
```bash
# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

---

## 🚀 배포 단계별 체크리스트

### **Phase 1: 환경 준비**
- [ ] 포트 충돌 확인 (80, 3002, 5432)
- [ ] 방화벽 설정 확인
- [ ] PostgreSQL 서비스 상태 확인
- [ ] nginx 설정 백업

### **Phase 2: WAS 서버 배포**
- [ ] 백엔드 코드 배포 (`apps/backend/`)
- [ ] 환경 변수 설정 (`.env`)
- [ ] 데이터베이스 마이그레이션
- [ ] PM2로 WAS 서버 시작
- [ ] API 엔드포인트 테스트

### **Phase 3: Web 서버 설정**
- [ ] 프론트엔드 빌드 (`npm run build`)
- [ ] 빌드 파일 nginx 디렉토리 복사
- [ ] nginx 설정 업데이트 (프록시 규칙)
- [ ] nginx 재시작
- [ ] 웹 사이트 접속 테스트

### **Phase 4: 통합 테스트**
- [ ] 프론트엔드 → 백엔드 API 호출 테스트
- [ ] 로그인/회원가입 플로우 테스트
- [ ] 데이터베이스 CRUD 작업 테스트
- [ ] 에러 핸들링 테스트
- [ ] 성능 모니터링 설정

---

## 🔧 유용한 명령어

### **서비스 상태 확인**
```bash
# 전체 서비스 상태 한 번에 확인
curl -s http://localhost/v1/health && echo "✅ WAS 서버 정상"
curl -s http://localhost && echo "✅ Web 서버 정상"
pg_isready -h localhost -p 5432 && echo "✅ 데이터베이스 정상"
```

### **로그 모니터링**
```bash
# 실시간 로그 확인
tail -f /var/log/nginx/access.log    # nginx 접속 로그
tail -f /var/log/nginx/error.log     # nginx 에러 로그
pm2 logs visitkorea-was              # WAS 서버 로그
```

### **성능 모니터링**
```bash
# 리소스 사용량 확인
htop                                 # CPU, 메모리 사용률
df -h                               # 디스크 사용량
netstat -tlnp                       # 포트 사용 상태
```

---

## 🚨 문제 해결

### **API 호출 실패 시**
1. **nginx 프록시 설정 확인**
   ```bash
   sudo nginx -t
   curl -v http://localhost/v1/health
   ```

2. **WAS 서버 상태 확인**
   ```bash
   pm2 status
   curl -v http://localhost:3002/v1/health
   ```

3. **환경 변수 확인**
   ```bash
   echo $VITE_API_BASE_URL
   cat .env | grep API
   ```

### **데이터베이스 연결 실패 시**
```bash
# PostgreSQL 서비스 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U vk -d vk -c "\dt"

# 환경 변수 확인
echo $DATABASE_URL
```

### **포트 충돌 시**
```bash
# 점유 프로세스 확인
sudo lsof -i :3002

# 프로세스 종료
sudo kill -9 [PID]

# 서비스 재시작
pm2 restart all
sudo systemctl restart nginx
```

---

## 📈 향후 분리 서버 대응

### **분리 시 변경사항**
```bash
# 환경 변수 업데이트
VITE_API_BASE_URL=http://[WAS_SERVER_IP]:3002

# nginx 프록시 업데이트
proxy_pass http://[WAS_SERVER_IP]:3002;

# 데이터베이스 연결 업데이트
DATABASE_URL=postgresql://vk:vk123456@[DB_SERVER_IP]:5432/vk
```

### **분리 시 고려사항**
- [ ] 네트워크 지연시간 고려
- [ ] CORS 설정 강화
- [ ] 보안 설정 (방화벽, VPN)
- [ ] 로드밸런싱 구성
- [ ] 데이터베이스 복제/백업

---

**💡 핵심**: API 기반 통신 구조를 유지하여 **언제든 분리 가능**하도록 설계! 🎯
