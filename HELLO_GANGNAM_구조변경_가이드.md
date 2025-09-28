# 🏙️ Hello-Gangnam 프로젝트 구조 변경 가이드

## 📋 **변경 사항 요약**

### 🎯 **메인 페이지 변경**
- **기존**: `Home.tsx` (전국 여행) → **새로운**: `GangnamMain.tsx` (강남 특화)
- **라우팅**: `/` → Hello-Gangnam 메인, `/nationwide` → 기존 전국 여행

### 📁 **폴더 구조 변경**
```
visitkorea-web/
├── apps/
│   └── frontend/
│       └── src/
│           ├── pages/
│           │   ├── GangnamMain.tsx      # 🆕 Hello-Gangnam 메인 페이지
│           │   ├── Home.tsx             # 🔄 전국 여행 페이지 (기존)
│           │   └── ...
│           ├── components/
│           │   └── PlaceDetailModal.tsx # 🔄 장소 상세정보 모달
│           └── main.tsx                 # 🔄 라우팅 설정 변경
```

---

## 🔧 **개발자별 적용 방법**

### **1️⃣ 개발자1 (현재 완료)**
- ✅ `GangnamMain.tsx` 생성 및 구현
- ✅ `main.tsx` 라우팅 수정
- ✅ `PlaceDetailModal.tsx` API 호출 최적화

### **2️⃣ 개발자2 적용**
```bash
# 1. 기존 백업
cp -r /home/ec2-user/visitkorea-web-dev2 /home/ec2-user/visitkorea-web-dev2-backup-$(date +%Y%m%d)

# 2. GangnamMain.tsx 복사
cp /home/ec2-user/visitkorea-web/apps/frontend/src/pages/GangnamMain.tsx \
   /home/ec2-user/visitkorea-web-dev2/apps/frontend/src/pages/

# 3. main.tsx 수정
cp /home/ec2-user/visitkorea-web/apps/frontend/src/main.tsx \
   /home/ec2-user/visitkorea-web-dev2/apps/frontend/src/

# 4. PlaceDetailModal.tsx 수정
cp /home/ec2-user/visitkorea-web/apps/frontend/src/components/PlaceDetailModal.tsx \
   /home/ec2-user/visitkorea-web-dev2/apps/frontend/src/components/
```

### **3️⃣ 개발자3 적용**
```bash
# 1. 기존 백업
cp -r /home/ec2-user/visitkorea-web-dev3 /home/ec2-user/visitkorea-web-dev3-backup-$(date +%Y%m%d)

# 2. GangnamMain.tsx 복사
cp /home/ec2-user/visitkorea-web/apps/frontend/src/pages/GangnamMain.tsx \
   /home/ec2-user/visitkorea-web-dev3/apps/frontend/src/pages/

# 3. main.tsx 수정
cp /home/ec2-user/visitkorea-web/apps/frontend/src/main.tsx \
   /home/ec2-user/visitkorea-web-dev3/apps/frontend/src/

# 4. PlaceDetailModal.tsx 수정
cp /home/ec2-user/visitkorea-web/apps/frontend/src/components/PlaceDetailModal.tsx \
   /home/ec2-user/visitkorea-web-dev3/apps/frontend/src/components/
```

---

## 📝 **주요 파일 변경 내용**

### **1. main.tsx (라우팅 설정)**
```typescript
// 변경 전
{ path: '/', element: <Home /> }

// 변경 후
{ path: '/', element: <GangnamMain /> }        // Hello-Gangnam 메인
{ path: '/nationwide', element: <Home /> }     // 전국 여행
```

### **2. GangnamMain.tsx (새로운 메인 페이지)**
- **기능**: K-Culture 투어 3개 (K-pop 데몬헌터, BTS 뮤비, K-드라마)
- **데이터**: 하드코딩된 투어 정보 (API 호출 없음)
- **API 연동**: 장소 클릭 시에만 PlaceDetailModal에서 Google Places API 호출

### **3. PlaceDetailModal.tsx (API 최적화)**
- **개선사항**: 
  - 100ms 지연으로 불필요한 API 호출 방지
  - 장소 클릭 시에만 렌더링
  - 좌표 거리 계산으로 정확한 장소 매칭

---

## 🚀 **테스트 방법**

### **1. 기본 기능 테스트**
```bash
# 프론트엔드 시작
cd /home/ec2-user/visitkorea-web-dev2  # 또는 dev3
npm run dev:fe

# 브라우저에서 확인
# http://localhost:5175 (dev2) 또는 http://localhost:5176 (dev3)
```

### **2. 기능 확인 체크리스트**
- [ ] Hello-Gangnam 메인 페이지 로드 (API 호출 없음)
- [ ] K-Culture 투어 3개 카드 표시
- [ ] "자세히 보기" 클릭 → 투어 상세 모달
- [ ] 투어 코스 장소 클릭 → PlaceDetailModal (API 호출)
- [ ] "전국 여행" 링크 → 기존 Home 페이지
- [ ] 개발자 도구에서 API 호출 로그 확인

---

## ⚠️ **주의사항**

### **1. API 키 통일**
모든 개발자 환경에서 동일한 Google Places API 키 사용:
```bash
GOOGLE_PLACES_BACKEND_KEY=AIzaSyBPhQpTMDUg63cLMXxLAB1obXu8BU18TA8
```

### **2. 포트 충돌 방지**
- **개발자1**: 프론트 5174, 백엔드 3002
- **개발자2**: 프론트 5175, 백엔드 3003  
- **개발자3**: 프론트 5176, 백엔드 3004

### **3. 백업 필수**
변경 전 반드시 기존 폴더 백업:
```bash
cp -r visitkorea-web-dev2 visitkorea-web-dev2-backup-$(date +%Y%m%d)
```

---

## 🔄 **롤백 방법**

문제 발생 시 기존 상태로 복원:
```bash
# 백업 폴더로 복원
rm -rf /home/ec2-user/visitkorea-web-dev2
mv /home/ec2-user/visitkorea-web-dev2-backup-YYYYMMDD /home/ec2-user/visitkorea-web-dev2
```

---

## 📞 **지원**

문제 발생 시 다음 정보와 함께 문의:
1. 개발자 번호 (dev2/dev3)
2. 오류 메시지
3. 브라우저 콘솔 로그
4. 백엔드 서버 로그

---

**📅 작성일**: 2025-01-15  
**👨‍💻 작성자**: AI Assistant  
**🔄 최종 수정**: Hello-Gangnam 프로젝트 구조 변경 완료
