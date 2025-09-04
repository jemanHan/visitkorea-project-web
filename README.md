# 🇰🇷 VisitKorea 프론트엔드 프로젝트

## 🚀 빠른 시작 가이드

### **1단계: 프로젝트 설정**
```bash
# 의존성 설치
npm install

# 환경변수 설정 (필요시)
cp .env.example .env.local
```

### **2단계: 프론트엔드 실행**

**방법 1: 루트에서 실행**
```bash
npm run dev:fe
```

**방법 2: 프론트엔드 디렉토리에서 직접 실행**
```bash
cd apps/frontend
npm run dev
```

## 🌐 서비스 URL
- **프론트엔드**: http://localhost:5173 (Vite 기본 포트)
- **백엔드 API**: http://localhost:3002 (별도 실행 필요)

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
[사용자] → [프론트엔드 (React + Vite)] → [백엔드 API (포트 3002)]
```

- **프론트엔드**: React + Vite (포트 5173)
- **백엔드**: Node.js API 서버 (포트 3002, 별도 실행)
- **스타일링**: Tailwind CSS + DaisyUI