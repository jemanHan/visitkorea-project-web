# 🇰🇷 VisitKorea 웹 서버 프로젝트

## 🚀 빠른 시작 가이드

### **방법 1: Docker로 실행 (권장)**

```bash
# 개발 모드 (핫 리로드)
./scripts/setup-docker.sh

# 프로덕션 모드 (nginx + 빌드)
./scripts/build-and-deploy.sh
```

### **방법 2: 직접 실행**

```bash
# 의존성 설치
npm install

# 프론트엔드 실행
npm run dev:fe
```

## 🌐 서비스 URL

- **웹사이트**: http://localhost (nginx)
- **프론트엔드**: http://localhost:5173 (개발 모드)
- **백엔드 API**: http://13.209.108.148:3002 (외부 서버)

## 🔧 자주 발생하는 오류 해결

### **포트 충돌 (5173)**
```bash
# 다른 포트로 실행
cd apps/frontend
npm run dev -- --port 3000
```

### **의존성 오류**
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### **빌드 오류**
```bash
# TypeScript 타입 체크
npm run typecheck

# 프론트엔드 빌드
npm run build:fe
```

## 📋 주요 명령어

### **루트에서 실행**
- `npm run dev:fe` - 프론트엔드 개발 서버 시작
- `npm run build:fe` - 프론트엔드 빌드
- `npm run typecheck` - TypeScript 타입 체크

### **프론트엔드 디렉토리에서 실행**
```bash
cd apps/frontend
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 🏗️ 시스템 아키텍처
```
[사용자] → [nginx] → [프론트엔드 (React + Vite)] → [외부 백엔드 API]
```

- **웹 서버**: nginx (포트 80)
- **프론트엔드**: React + Vite (포트 5173)
- **백엔드**: 외부 API 서버 (13.209.108.148:3002)
- **스타일링**: Tailwind CSS + DaisyUI

## 📚 상세 가이드

- **Windows 팀원**: [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
- **Docker 환경**: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **프로덕션 환경**: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)