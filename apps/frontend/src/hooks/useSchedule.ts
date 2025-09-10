// 이 파일은 더 이상 사용하지 않습니다. useScheduleApi를 사용하세요.

export interface ScheduleItem {
  id: string;                    // Prisma CUID (25자 문자열)
  userId: string;                // 사용자 ID
  date: string;                  // ISO 8601 형식
  startTime: string;             // HH:MM 형식 (24시간)
  endTime: string;               // HH:MM 형식 (24시간)
  title: string;                 // 스케줄 제목 (필수)
  remarks?: string | null;       // 비고 (선택)
  order: number;                 // 순서 (정수)
  createdAt: string;             // ISO 8601 형식
  updatedAt: string;             // ISO 8601 형식
}

export interface ScheduleData {
  [dateKey: string]: ScheduleItem[];
}

// 이 훅은 더 이상 사용하지 않습니다. useScheduleApi를 사용하세요.