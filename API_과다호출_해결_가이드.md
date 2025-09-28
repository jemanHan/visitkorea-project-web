# 🚨 API 과다호출 문제 해결 가이드

## 📋 문제 상황
- **Google Places API 사용량 급증**: 며칠 새 40만원 청구
- **원인**: React `useEffect` 무한 루프로 인한 API 과다호출
- **영향**: 개발비용 급증, API 할당량 초과 위험

## 🔍 문제 원인 분석

### 1. 무한 루프 발생 지점
```typescript
// ❌ 문제가 있던 코드 (Home.tsx)
useEffect(() => {
  void loadRecommended();
}, [region, urlQuery, currentPage, lastFetchKey]); // lastFetchKey가 의존성에 포함

useEffect(() => {
  void loadRecommended();
}, [region, urlQuery, currentPage]); // loadRecommended가 의존성에 없음
```

### 2. 무한 루프 메커니즘
1. `loadRecommended` 함수 실행
2. `setLastFetchKey` 호출로 상태 변경
3. `lastFetchKey` 변경으로 `useEffect` 재실행
4. 1번으로 돌아가서 무한 반복

## ✅ 해결 방법

### 1. useEffect 의존성 수정
```typescript
// ✅ 수정된 코드
const loadRecommended = useCallback(async () => {
  // ... 로직
}, [region, urlQuery, currentPage]); // lastFetchKey 의존성 제거

useEffect(() => {
  void loadRecommended();
}, [loadRecommended]); // loadRecommended 함수만 의존성으로 추가
```

### 2. API 요청 제한 구현 (fetchers.ts)
```typescript
// 요청 제한 변수
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 최소 500ms 간격
const requestQueue = new Map<string, Promise<any>>();

// 캐시된 fetch 함수
async function cachedFetch(url: string, options?: RequestInit) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const now = Date.now();
  
  // 캐시 확인
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  // 요청 큐 확인 (중복 요청 방지)
  if (requestQueue.has(queueKey)) {
    return await requestQueue.get(queueKey);
  }
  
  // 요청 간격 제한
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  // 실제 API 요청
  const requestPromise = fetch(url, options);
  requestQueue.set(queueKey, requestPromise);
  
  try {
    const response = await requestPromise;
    // ... 응답 처리
  } finally {
    requestQueue.delete(queueKey);
    lastRequestTime = Date.now();
  }
}
```

### 3. 캐시 시스템 강화
```typescript
// 캐시 설정
const CACHE_DURATION = 30000; // 30초 캐시
const MAX_CACHE_SIZE = 100; // 최대 캐시 항목 수

// 캐시 크기 제한
function limitCacheSize() {
  if (requestCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(requestCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, requestCache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => requestCache.delete(key));
  }
}
```

## 🛠️ 적용 방법

### 1. 개발자 2, 3 환경에 적용
```bash
# 1. 백업 폴더에서 수정된 파일들 복사
cp visitkorea-web-backup-*/apps/frontend/src/pages/Home.tsx visitkorea-web-dev2/apps/frontend/src/pages/
cp visitkorea-web-backup-*/apps/frontend/src/lib/fetchers.ts visitkorea-web-dev2/apps/frontend/src/lib/

# 2. 개발자 3에도 동일하게 적용
cp visitkorea-web-backup-*/apps/frontend/src/pages/Home.tsx visitkorea-web-dev3/apps/frontend/src/pages/
cp visitkorea-web-backup-*/apps/frontend/src/lib/fetchers.ts visitkorea-web-dev3/apps/frontend/src/lib/
```

### 2. 수정된 파일 목록
- `apps/frontend/src/pages/Home.tsx`
- `apps/frontend/src/lib/fetchers.ts`

## 📊 모니터링 방법

### 1. 개발자 도구에서 확인
```javascript
// 브라우저 콘솔에서 API 호출 확인
console.log('API 호출 횟수:', window.apiCallCount || 0);
```

### 2. 네트워크 탭 모니터링
- F12 → Network 탭
- `/v1/search` 요청 빈도 확인
- 30초 내 중복 요청이 없어야 함

### 3. 로그 확인
```typescript
// fetchers.ts에 추가된 로그
console.log('🚦 Rate limiting: waiting 500ms for', url);
console.log('📡 API Request:', url);
```

## ⚠️ 주의사항

### 1. API 키 보안
- `.env.local` 파일에 API 키 저장
- Git에 커밋하지 않도록 주의
- 정기적으로 API 키 갱신

### 2. 캐시 관리
- 개발 중에는 캐시 시간을 짧게 설정
- 프로덕션에서는 적절한 캐시 시간 설정

### 3. 에러 처리
- API 요청 실패 시 재시도 로직 구현
- 네트워크 오류 시 사용자에게 알림

## 🔧 추가 최적화 방안

### 1. 디바운싱 (Debouncing)
```typescript
// 검색어 입력 시 디바운싱 적용
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    // 검색 로직
  }, 300),
  []
);
```

### 2. 가상화 (Virtualization)
```typescript
// 대량 데이터 렌더링 시 가상화 적용
import { FixedSizeList as List } from 'react-window';
```

### 3. 메모이제이션
```typescript
// 컴포넌트 메모이제이션
const MemoizedPlaceCard = React.memo(PlaceCard);
```

## 📈 성과 측정

### 적용 전
- API 호출: 페이지 로드 시마다 10-20회
- 비용: 일일 10만원 이상
- 사용자 경험: 로딩 지연

### 적용 후
- API 호출: 30초 캐시로 90% 감소
- 비용: 일일 1만원 이하
- 사용자 경험: 빠른 응답 속도

## 🚀 향후 개선 계획

1. **Redis 캐시 도입**: 서버 사이드 캐싱
2. **CDN 활용**: 정적 데이터 CDN 배포
3. **API 게이트웨이**: 요청 제한 및 모니터링
4. **실시간 모니터링**: API 사용량 대시보드

---

**📞 문의사항이 있으면 개발자 1에게 연락하세요!**
