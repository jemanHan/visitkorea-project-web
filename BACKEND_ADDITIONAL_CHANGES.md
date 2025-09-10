# 백엔드 추가 변경사항 (2025-01-09)

## 🔄 프론트엔드 변경사항 요약

### 1. 날짜 선택 모달 추가
- **새 컴포넌트:** `DateSelectModal.tsx`
- **기능:** 지역 상세페이지에서 스케줄에 추가 시 날짜 선택
- **사용법:** 날짜 선택 → 스케줄 페이지로 이동

### 2. 지역 상세페이지 수정
- **파일:** `DetailPage.tsx`
- **변경사항:** "스케줄에 추가" 버튼에 모달 기능 추가
- **플로우:** 버튼 클릭 → 날짜 선택 모달 → 스케줄 페이지 이동

### 3. URL 파라미터 전달
- **형식:** `/schedule?place={장소명}&date={YYYY-MM-DD}`
- **예시:** `/schedule?place=경복궁&date=2025-09-10`

## 📋 백엔드에서 확인해야 할 사항

### 1. 스케줄 생성 API 검증 강화

#### 현재 API 엔드포인트
```
POST /v1/schedules
```

#### 요청 데이터 형식
```json
{
  "date": "2025-09-10",        // 필수: YYYY-MM-DD 형식
  "startTime": "09:00",        // 필수: HH:MM 형식 (24시간)
  "endTime": "10:00",          // 필수: HH:MM 형식 (24시간)
  "title": "스케줄 제목",      // 필수: 문자열
  "remarks": "비고"            // 선택: 문자열 또는 null
}
```

#### 백엔드 검증 로직 확인사항
```javascript
// 1. 날짜 형식 검증
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(data.date)) {
  return res.status(400).json({
    success: false,
    error: "Invalid date format",
    message: "Date must be in YYYY-MM-DD format"
  });
}

// 2. 시간 형식 검증
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
  return res.status(400).json({
    success: false,
    error: "Invalid time format",
    message: "Time must be in HH:MM format (24-hour)"
  });
}

// 3. 시간 범위 검증
if (data.startTime >= data.endTime) {
  return res.status(400).json({
    success: false,
    error: "Invalid time range",
    message: "Start time must be earlier than end time"
  });
}

// 4. 제목 필수 검증
if (!data.title || data.title.trim() === '') {
  return res.status(400).json({
    success: false,
    error: "Missing required field",
    message: "Title is required"
  });
}
```

### 2. 에러 응답 형식 통일

#### 표준 에러 응답 형식
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "사용자 친화적 에러 메시지",
  "details": {
    "field": "구체적인 필드명",
    "value": "잘못된 값"
  }
}
```

#### 에러 코드 목록
- `INVALID_DATE_FORMAT`: 날짜 형식 오류
- `INVALID_TIME_FORMAT`: 시간 형식 오류
- `INVALID_TIME_RANGE`: 시간 범위 오류
- `MISSING_REQUIRED_FIELD`: 필수 필드 누락
- `UNAUTHORIZED`: 인증 실패
- `NOT_FOUND`: 리소스 없음

### 3. 로깅 강화

#### 요청 로깅
```javascript
console.log('=== 스케줄 생성 요청 ===');
console.log('Request Body:', JSON.stringify(req.body, null, 2));
console.log('User ID:', req.user?.id);
console.log('Request Time:', new Date().toISOString());
```

#### 에러 로깅
```javascript
console.error('=== 스케줄 생성 실패 ===');
console.error('Error:', error);
console.error('Request Body:', req.body);
console.error('User ID:', req.user?.id);
```

### 4. 데이터베이스 스키마 확인

#### Schedule 테이블 구조
```sql
CREATE TABLE schedules (
  id VARCHAR(25) PRIMARY KEY,           -- Prisma CUID
  userId VARCHAR(25) NOT NULL,          -- 사용자 ID
  date DATE NOT NULL,                   -- 날짜 (YYYY-MM-DD)
  startTime TIME NOT NULL,              -- 시작 시간 (HH:MM)
  endTime TIME NOT NULL,                -- 종료 시간 (HH:MM)
  title VARCHAR(255) NOT NULL,          -- 제목
  remarks TEXT,                         -- 비고 (NULL 허용)
  order INTEGER DEFAULT 1,              -- 순서
  createdAt TIMESTAMP DEFAULT NOW(),    -- 생성일시
  updatedAt TIMESTAMP DEFAULT NOW()     -- 수정일시
);
```

#### 인덱스 확인
```sql
-- 사용자별 날짜별 조회 최적화
CREATE INDEX idx_schedules_user_date ON schedules(userId, date);

-- 날짜별 조회 최적화
CREATE INDEX idx_schedules_date ON schedules(date);
```

### 5. CORS 설정 확인

#### 프론트엔드 도메인 허용
```javascript
const corsOptions = {
  origin: [
    'http://3.37.44.85',           // EC2 프론트엔드
    'http://localhost:3000',       // 로컬 개발
    'http://localhost:5173'        // Vite 개발 서버
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 6. JWT 토큰 검증 강화

#### 토큰 검증 미들웨어
```javascript
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'JWT token is required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token'
    });
  }
}
```

### 7. 테스트 시나리오

#### 성공 케이스
```bash
# 정상적인 스케줄 생성
curl -X POST http://13.209.108.148:3002/v1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid_token}" \
  -d '{
    "date": "2025-09-10",
    "startTime": "09:00",
    "endTime": "10:00",
    "title": "경복궁 관람",
    "remarks": "오전 관람"
  }'
```

#### 실패 케이스들
```bash
# 1. 잘못된 날짜 형식
curl -X POST http://13.209.108.148:3002/v1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid_token}" \
  -d '{
    "date": "2025/09/10",
    "startTime": "09:00",
    "endTime": "10:00",
    "title": "테스트"
  }'

# 2. 잘못된 시간 형식
curl -X POST http://13.209.108.148:3002/v1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid_token}" \
  -d '{
    "date": "2025-09-10",
    "startTime": "9:00",
    "endTime": "10:00",
    "title": "테스트"
  }'

# 3. 제목 누락
curl -X POST http://13.209.108.148:3002/v1/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid_token}" \
  -d '{
    "date": "2025-09-10",
    "startTime": "09:00",
    "endTime": "10:00"
  }'

# 4. 토큰 없음
curl -X POST http://13.209.108.148:3002/v1/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-09-10",
    "startTime": "09:00",
    "endTime": "10:00",
    "title": "테스트"
  }'
```

### 8. 성능 최적화

#### 데이터베이스 쿼리 최적화
```javascript
// 날짜별 스케줄 조회 최적화
const schedules = await prisma.schedule.findMany({
  where: {
    userId: req.user.id,
    date: new Date(req.params.date)
  },
  orderBy: [
    { startTime: 'asc' }
  ]
});
```

#### 응답 캐싱 (선택사항)
```javascript
// Redis 캐싱 예시
const cacheKey = `schedules:${userId}:${date}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return res.json(JSON.parse(cached));
}
```

### 9. 모니터링 및 알림

#### 에러 모니터링
```javascript
// 에러 발생 시 알림 (Slack, Discord 등)
if (error.status >= 500) {
  await sendErrorNotification({
    error: error.message,
    stack: error.stack,
    request: req.body,
    user: req.user?.id
  });
}
```

### 10. 배포 체크리스트

#### 배포 전 확인사항
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 환경변수 설정 확인
- [ ] CORS 설정 확인
- [ ] JWT 시크릿 키 확인
- [ ] 로그 레벨 설정
- [ ] 에러 핸들링 테스트
- [ ] API 엔드포인트 테스트

#### 배포 후 확인사항
- [ ] 헬스체크 엔드포인트 동작
- [ ] 스케줄 생성/조회/수정/삭제 테스트
- [ ] 에러 응답 형식 확인
- [ ] 로그 출력 확인
- [ ] 성능 모니터링

---

## 🚀 프론트엔드 배포 완료

**새로운 빌드 파일:**
- `index-ca7a0cP-.js` (269.69 kB)

**구현된 기능:**
1. ✅ 날짜 선택 모달
2. ✅ 지역 상세페이지에서 스케줄 추가 플로우
3. ✅ URL 파라미터 전달
4. ✅ 디버깅 로그 추가

**테스트 방법:**
1. 지역 상세페이지 접속
2. "📅 스케줄에 추가" 버튼 클릭
3. 날짜 선택 모달에서 날짜 선택
4. "스케줄 페이지로 이동" 버튼 클릭
5. 스케줄 페이지에서 장소명과 날짜가 자동 입력됨

이제 백엔드에서 위의 사항들을 확인하고 수정하면 완벽하게 연동될 것입니다! 🎯

