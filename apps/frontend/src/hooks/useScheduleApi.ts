// 스케줄 API 연동을 위한 React 훅
import { useState, useEffect, useCallback } from 'react';
import { scheduleService, Schedule, ScheduleCreateData, ScheduleUpdateData, BatchScheduleData } from '../services/scheduleService';

export interface UseScheduleApiReturn {
  // 상태
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  
  // 액션
  loadSchedules: (date: Date) => Promise<void>;
  createSchedule: (data: ScheduleCreateData) => Promise<Schedule | null>;
  updateSchedule: (id: string, data: ScheduleUpdateData) => Promise<Schedule | null>;
  deleteSchedule: (id: string) => Promise<boolean>;
  saveAllSchedules: (data: BatchScheduleData) => Promise<boolean>;
  
  // 유틸리티
  clearError: () => void;
  refreshSchedules: () => Promise<void>;
}

export const useScheduleApi = (initialDate?: Date): UseScheduleApiReturn => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date());

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 스케줄 로드
  const loadSchedules = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentDate(date);
      
      const dateString = scheduleService.formatDate(date);
      const data = await scheduleService.getSchedules(dateString);
      setSchedules(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스케줄을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Schedule load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 스케줄 생성
  const createSchedule = useCallback(async (data: ScheduleCreateData): Promise<Schedule | null> => {
    try {
      setLoading(true);
      setError(null);

      // 데이터 검증
      const validation = scheduleService.validateSchedule(data);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return null;
      }

      const newSchedule = await scheduleService.createSchedule(data);
      
      // 로컬 상태 업데이트
      setSchedules(prev => [...prev, newSchedule]);
      
      return newSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스케줄 생성에 실패했습니다.';
      setError(errorMessage);
      console.error('Schedule create error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 스케줄 수정
  const updateSchedule = useCallback(async (id: string, data: ScheduleUpdateData): Promise<Schedule | null> => {
    try {
      setLoading(true);
      setError(null);

      const updatedSchedule = await scheduleService.updateSchedule(id, data);
      
      // 로컬 상태 업데이트
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === id ? updatedSchedule : schedule
        )
      );
      
      return updatedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스케줄 수정에 실패했습니다.';
      setError(errorMessage);
      console.error('Schedule update error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 스케줄 삭제
  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await scheduleService.deleteSchedule(id);
      
      // 로컬 상태 업데이트
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스케줄 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('Schedule delete error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 스케줄 일괄 저장
  const saveAllSchedules = useCallback(async (data: BatchScheduleData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await scheduleService.saveAllSchedules(data);
      
      // 저장 후 서버에서 최신 데이터 다시 로드
      await loadSchedules(currentDate);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스케줄 저장에 실패했습니다.';
      setError(errorMessage);
      console.error('Schedule save all error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentDate, loadSchedules]);

  // 스케줄 새로고침
  const refreshSchedules = useCallback(async () => {
    await loadSchedules(currentDate);
  }, [currentDate, loadSchedules]);

  // 초기 로드
  useEffect(() => {
    if (initialDate) {
      loadSchedules(initialDate);
    }
  }, [initialDate, loadSchedules]);

  return {
    // 상태
    schedules,
    loading,
    error,
    
    // 액션
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    saveAllSchedules,
    
    // 유틸리티
    clearError,
    refreshSchedules,
  };
};

export default useScheduleApi;

