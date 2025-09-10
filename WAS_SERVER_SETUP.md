# 🚀 WAS 서버 통합 설정 가이드 (Cursor용)

## 📋 현재 상황
- **Web 서버**: `3.37.44.85` (프론트엔드만 운영 중)
- **WAS 서버**: `13.209.108.148` (백엔드 API 운영 중)
- **목표**: WAS 서버에서 프론트엔드 + 백엔드 통합 운영

---

## 🎯 WAS 서버에서 해야 할 작업

### **1단계: 프로젝트 클론 및 설정**

```bash
# 1. 기존 디렉토리 확인 및 백업
cd /home/ec2-user
ls -la

# 2. 프로젝트 클론
git clone https://github.com/jemanHan/visitkorea-project-web.git visitkorea-integrated
cd visitkorea-integrated

# 3. 권한 설정
sudo chown -R ec2-user:ec2-user /home/ec2-user/visitkorea-integrated
chmod -R 755 /home/ec2-user/visitkorea-integrated
```

### **2단계: 환경 변수 확인 및 수정**

#### **현재 포함된 환경 변수들:**
```bash
# 루트 .env
VITE_API_BASE_URL=http://13.209.108.148:3002
NODE_ENV=production

# apps/frontend/.env
VITE_API_BASE_URL=http://13.209.108.148:3002

# apps/frontend/.env.local
VITE_API_BASE_URL=http://13.209.108.148:3002
VITE_GOOGLE_MAPS_BROWSER_KEY=AIzaSyCnT1GyYL7Kz4xHOkbAhbAhT-pkaVOPV_U
```

#### **WAS 서버용으로 수정 (선택사항):**
```bash
# API URL을 localhost로 변경하려면 (선택)
sed -i 's|http://13.209.108.148:3002|http://localhost:3002|g' .env
sed -i 's|http://13.209.108.148:3002|http://localhost:3002|g' apps/frontend/.env
sed -i 's|http://13.209.108.148:3002|http://localhost:3002|g' apps/frontend/.env.local
```

### **3단계: 백엔드 환경 변수 추가**

```bash
# WAS 서버용 백엔드 환경 변수 생성
cat > apps/backend/.env << 'EOF'
# WAS 서버 백엔드 환경 변수
PORT=3002
DATABASE_URL=postgresql://vk:vk123456@localhost:5432/vk
GOOGLE_PLACES_BACKEND_KEY=AIzaSyCnT1GyYL7Kz4xHOkbAhbAhT-pkaVOPV_U
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=production
CORS_ORIGIN=http://localhost,http://13.209.108.148
EOF
```

### **4단계: 의존성 설치**

```bash
# 루트 의존성 설치
npm install

# 프론트엔드 의존성 설치
cd apps/frontend
npm install
cd ../..

# 백엔드 의존성 설치 (백엔드 코드 추가 시)
# cd apps/backend
# npm install
# cd ../..
```

### **5단계: 프론트엔드 빌드**

```bash
# 프론트엔드 빌드
cd apps/frontend
npm run build
cd ../..

# 빌드 파일 nginx 디렉토리에 복사
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r apps/frontend/dist/* /usr/share/nginx/html/
sudo chown -R nginx:nginx /usr/share/nginx/html/
```

### **6단계: nginx 설정 업데이트**

```bash
# 현재 nginx 설정 백업
sudo cp /etc/nginx/conf.d/visitkorea.conf /etc/nginx/conf.d/visitkorea.conf.backup.$(date +%Y%m%d_%H%M%S)

# 새 nginx 설정 적용
sudo tee /etc/nginx/conf.d/visitkorea.conf > /dev/null << 'EOF'
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
    
    # API 프록시 (통합 서버용 - localhost:3002로 프록시)
    location /v1/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        # OPTIONS 요청 처리
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # 타임아웃 설정
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
EOF

# nginx 설정 테스트
sudo nginx -t

# nginx 재시작
sudo systemctl restart nginx
```

---

## 🔧 백엔드 서버 설정 (향후 추가 시)

### **백엔드 코드 구조 예시:**
```bash
# apps/backend/ 디렉토리에 다음과 같은 구조로 백엔드 코드 추가
apps/backend/
├── src/
│   ├── routes/
│   │   ├── auth.js      # 인증 라우트 (/v1/auth/*)
│   │   ├── places.js    # 장소 라우트 (/v1/places/*)
│   │   └── schedules.js # 스케줄 라우트 (/v1/schedules/*)
│   ├── middleware/
│   │   ├── auth.js      # JWT 인증 미들웨어
│   │   └── cors.js      # CORS 설정
│   ├── models/
│   │   └── index.js     # Prisma 모델
│   └── app.js           # Express 앱 설정
├── prisma/
│   ├── schema.prisma    # 데이터베이스 스키마
│   └── migrations/      # 마이그레이션 파일들
├── package.json
├── .env                 # 환경 변수
└── server.js            # 서버 진입점
```

### **백엔드 서버 시작 명령:**
```bash
# PM2로 백엔드 서버 시작
pm2 start apps/backend/server.js --name "visitkorea-backend" --watch

# 또는 직접 실행
cd apps/backend
node server.js
```

---

## 📊 데이터베이스 설정

### **PostgreSQL 확인:**
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 데이터베이스 연결 테스트
psql -h localhost -U vk -d vk -c "SELECT version();"

# 데이터베이스 생성 (필요시)
sudo -u postgres createuser -s vk
sudo -u postgres createdb -O vk vk
sudo -u postgres psql -c "ALTER USER vk PASSWORD 'vk123456';"
```

### **Prisma 마이그레이션 (백엔드 코드 추가 시):**
```bash
# Prisma 클라이언트 생성
cd apps/backend
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev

# Prisma Studio 실행 (선택사항)
npx prisma studio
cd ../..
```

---

## 🧪 테스트 및 확인

### **1. 프론트엔드 테스트:**
```bash
# 웹사이트 접속 테스트
curl -I http://localhost
curl -I http://13.209.108.148

# 빌드 파일 확인
ls -la /usr/share/nginx/html/
```

### **2. API 테스트 (백엔드 추가 시):**
```bash
# 헬스체크 엔드포인트 테스트
curl http://localhost:3002/v1/health

# API 프록시 테스트
curl http://localhost/v1/health
```

### **3. 로그 확인:**
```bash
# nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2 로그 (백엔드 실행 시)
pm2 logs visitkorea-backend

# 시스템 리소스 확인
htop
df -h
```

---

## 🚨 문제 해결

### **포트 충돌 해결:**
```bash
# 포트 사용 상태 확인
sudo netstat -tlnp | grep -E ':(80|3002|5432)'

# 특정 포트 점유 프로세스 종료
sudo lsof -i :3002
sudo kill -9 [PID]
```

### **권한 문제 해결:**
```bash
# 파일 권한 설정
sudo chown -R ec2-user:ec2-user /home/ec2-user/visitkorea-integrated
sudo chown -R nginx:nginx /usr/share/nginx/html/

# 실행 권한 부여
chmod +x /home/ec2-user/visitkorea-integrated/scripts/*.sh
```

### **nginx 문제 해결:**
```bash
# nginx 설정 테스트
sudo nginx -t

# nginx 재시작
sudo systemctl restart nginx

# nginx 상태 확인
sudo systemctl status nginx
```

---

## 📋 체크리스트

### **필수 작업:**
- [ ] 프로젝트 클론 완료
- [ ] 환경 변수 설정 완료
- [ ] 의존성 설치 완료
- [ ] 프론트엔드 빌드 완료
- [ ] nginx 설정 업데이트 완료
- [ ] 웹사이트 접속 테스트 완료

### **선택 작업 (백엔드 추가 시):**
- [ ] 백엔드 환경 변수 설정
- [ ] 백엔드 코드 추가
- [ ] 데이터베이스 마이그레이션
- [ ] PM2로 백엔드 서버 시작
- [ ] API 엔드포인트 테스트

### **모니터링:**
- [ ] 로그 모니터링 설정
- [ ] 성능 모니터링 설정
- [ ] 자동 재시작 설정 (PM2)

---

## 💡 중요 참고사항

### **현재 상태:**
- ✅ 프론트엔드 코드: 완성됨 (날짜 선택 모달, 스케줄 기능 포함)
- ✅ 환경 변수: 모두 설정됨
- ✅ 빌드 파일: 최신 상태로 포함됨
- ⏳ 백엔드 코드: 향후 추가 예정

### **API 엔드포인트 (백엔드에서 구현해야 할 것들):**
```
POST /v1/auth/login       # 로그인
POST /v1/auth/signup      # 회원가입
GET  /v1/auth/me          # 사용자 정보
POST /v1/schedules        # 스케줄 생성
GET  /v1/schedules        # 스케줄 조회
PUT  /v1/schedules/:id    # 스케줄 수정
DELETE /v1/schedules/:id  # 스케줄 삭제
GET  /v1/places/search    # 장소 검색
POST /v1/places/like      # 장소 좋아요
```

### **다음 단계:**
1. 이 가이드대로 통합 서버 설정
2. 백엔드 API 코드 구현
3. 프론트엔드-백엔드 연동 테스트
4. 운영 환경 최적화

---

**🎯 이 문서를 따라 하면 WAS 서버에서 통합 환경을 완벽하게 구축할 수 있습니다!**
