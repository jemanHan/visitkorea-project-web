import { useState, useEffect } from 'react';

export interface ScheduleItem {
  id: number;
  startTime: string;
  endTime: string;
  googleApiData: string;
  remarks: string;
}

export interface ScheduleData {
  [dateKey: string]: ScheduleItem[];
}

const STORAGE_KEY = 'visitkorea_schedules';

export const useSchedule = () => {
  const [schedules, setSchedules] = useState<ScheduleData>({});

  // 날짜를 키로 변환하는 함수
  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const savedSchedules = localStorage.getItem(STORAGE_KEY);
    if (savedSchedules) {
      try {
        setSchedules(JSON.parse(savedSchedules));
      } catch (error) {
        console.error('Failed to parse saved schedules:', error);
      }
    }
  }, []);

  // 스케줄 데이터를 로컬 스토리지에 저장
  const saveSchedules = (newSchedules: ScheduleData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedules));
    setSchedules(newSchedules);
  };

  // 특정 날짜의 스케줄 가져오기
  const getSchedulesForDate = (date: Date): ScheduleItem[] => {
    const dateKey = getDateKey(date);
    return schedules[dateKey] || [];
  };

  // 특정 날짜에 스케줄 추가
  const addSchedule = (date: Date, schedule: Omit<ScheduleItem, 'id'>) => {
    const dateKey = getDateKey(date);
    const existingSchedules = schedules[dateKey] || [];
    const newSchedule: ScheduleItem = {
      ...schedule,
      id: Math.max(...existingSchedules.map(s => s.id), 0) + 1
    };
    
    const newSchedules = {
      ...schedules,
      [dateKey]: [...existingSchedules, newSchedule]
    };
    
    saveSchedules(newSchedules);
    return newSchedule;
  };

  // 스케줄 삭제
  const deleteSchedule = (date: Date, scheduleId: number) => {
    const dateKey = getDateKey(date);
    const existingSchedules = schedules[dateKey] || [];
    const filteredSchedules = existingSchedules.filter(s => s.id !== scheduleId);
    
    const newSchedules = {
      ...schedules,
      [dateKey]: filteredSchedules
    };
    
    saveSchedules(newSchedules);
  };

  // 스케줄 업데이트
  const updateSchedule = (date: Date, scheduleId: number, updates: Partial<ScheduleItem>) => {
    const dateKey = getDateKey(date);
    const existingSchedules = schedules[dateKey] || [];
    const updatedSchedules = existingSchedules.map(s => 
      s.id === scheduleId ? { ...s, ...updates } : s
    );
    
    const newSchedules = {
      ...schedules,
      [dateKey]: updatedSchedules
    };
    
    saveSchedules(newSchedules);
  };

  // 특정 날짜의 모든 스케줄 삭제
  const clearSchedulesForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    const newSchedules = { ...schedules };
    delete newSchedules[dateKey];
    saveSchedules(newSchedules);
  };

  return {
    schedules,
    getSchedulesForDate,
    addSchedule,
    deleteSchedule,
    updateSchedule,
    clearSchedulesForDate
  };
};
