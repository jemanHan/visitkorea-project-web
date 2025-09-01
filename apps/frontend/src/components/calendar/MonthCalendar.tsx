import React, { useState } from 'react';

interface MonthCalendarProps {
  onDateSelect?: (date: Date) => void;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 달력에 표시할 첫 번째 날 (이전 달의 일부 포함)
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  
  // 달력에 표시할 마지막 날 (다음 달의 일부 포함)
  const lastDayOfCalendar = new Date(lastDayOfMonth);
  lastDayOfCalendar.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));

  // 달력에 표시할 모든 날짜 생성
  const calendarDays: Date[] = [];
  const current = new Date(firstDayOfCalendar);
  
  while (current <= lastDayOfCalendar) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 이전 월로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 다음 월로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 현재 월의 날짜인지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="max-w-4xl mx-auto">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 달력 그리드 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`p-4 text-center font-medium text-sm ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => (
            <div
              key={index}
              onClick={() => onDateSelect?.(date)}
              className={`
                min-h-[80px] p-2 border-r border-b border-gray-200 cursor-pointer
                hover:bg-gray-50 transition-colors
                ${!isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`
                    text-sm font-medium
                    ${isToday(date) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                    ${!isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-700'}
                  `}
                >
                  {date.getDate()}
                </span>
                
                {/* 스케줄 표시 (예시) */}
                {isCurrentMonth(date) && Math.random() > 0.7 && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>
              
              {/* 스케줄 내용 (예시) */}
              {isCurrentMonth(date) && date.getDate() % 7 === 0 && (
                <div className="mt-1">
                  <div className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                    경복궁 투어
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 달력 범례 */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>스케줄 있음</span>
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;
