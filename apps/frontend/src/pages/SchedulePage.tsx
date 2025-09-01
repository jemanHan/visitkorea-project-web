import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CalendarSelector from '../components/schedule/CalendarSelector';
import ScheduleDisplay from '../components/schedule/ScheduleDisplay';
import TopBar from '../components/layout/TopBar';
import FloatingActionButton from '../components/layout/FloatingActionButton';

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCalendar, setSelectedCalendar] = useState<string>('calendar-1');
  const [searchParams] = useSearchParams();
  const [initialPlaceName, setInitialPlaceName] = useState<string>('');
  const navigate = useNavigate();

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
            <ScheduleDisplay 
              selectedDate={selectedDate} 
              initialPlaceName={initialPlaceName}
            />
          </div>
                 </div>
       </div>
       <FloatingActionButton />
     </div>
   );
 };

export default SchedulePage;
