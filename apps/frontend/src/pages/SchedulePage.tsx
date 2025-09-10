import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CalendarSelector from '../components/schedule/CalendarSelector';
import ScheduleDisplay from '../components/schedule/ScheduleDisplay';
import TopBar from '../components/layout/TopBar';
import FloatingActionButton from '../components/layout/FloatingActionButton';
import { useScheduleApi } from '../hooks/useScheduleApi';
import { getToken } from '../auth/token';

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCalendar, setSelectedCalendar] = useState<string>('calendar-1');
  const [searchParams] = useSearchParams();
  const [initialPlaceName, setInitialPlaceName] = useState<string>('');
  const navigate = useNavigate();

  // API 훅 사용
  const {
    schedules,
    loading,
    error,
    loadSchedules,
    clearError
  } = useScheduleApi(selectedDate);

  // 전체 저장 기능은 제거 (개별 저장으로 대체)

  // 로그인 상태 확인
  useEffect(() => {
    const token = getToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
  }, [navigate]);

  // URL 파라미터에서 장소명과 날짜 가져오기
  useEffect(() => {
    const place = searchParams.get('place');
    const date = searchParams.get('date');
    
    if (place) {
      setInitialPlaceName(decodeURIComponent(place));
    }
    
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }
  }, [searchParams]);

  // 선택된 날짜가 변경될 때 스케줄 로드
  useEffect(() => {
    loadSchedules(selectedDate);
  }, [selectedDate, loadSchedules]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <div className="inline-block bg-gray-200 rounded-lg px-4 py-2 text-sm font-medium">
            Main Page 회원페이지
          </div>
        </div>
        
        <div className="flex gap-6">
          {/* 왼쪽 패널 - 달력 선택 */}
          <div className="w-80">
            <CalendarSelector 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedCalendar={selectedCalendar}
              onCalendarChange={setSelectedCalendar}
            />
          </div>
          
          {/* 오른쪽 패널 - 스케줄 표시 */}
          <div className="flex-1">
            {loading && (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">스케줄을 불러오는 중...</div>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
            <ScheduleDisplay 
              selectedDate={selectedDate} 
              initialPlaceName={initialPlaceName}
              schedules={schedules}
              onScheduleUpdate={loadSchedules}
            />
          </div>
                 </div>
       </div>
       <FloatingActionButton />
     </div>
   );
 };

export default SchedulePage;
