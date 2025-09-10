import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../../hooks/useSchedule';
import ScheduleEditModal from './ScheduleEditModal';
import TimeInput from './TimeInput';
import { scheduleApi } from '../../lib/api';

interface ScheduleDisplayProps {
  selectedDate: Date;
  initialPlaceName?: string;
  schedules?: any[];
  onScheduleUpdate?: (date: Date) => void;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ 
  selectedDate, 
  initialPlaceName, 
  schedules: propSchedules = [], 
  onScheduleUpdate 
}) => {
  // API에서 받은 스케줄만 사용 (로컬 스케줄 사용 안함)
  const schedules = propSchedules;



  // initialPlaceName이 변경될 때 newSchedule의 title 업데이트
  useEffect(() => {
    if (initialPlaceName) {
      setNewSchedule(prev => ({
        ...prev,
        title: initialPlaceName
      }));
    }
  }, [initialPlaceName]);

  const [newSchedule, setNewSchedule] = useState<Omit<ScheduleItem, 'id' | 'userId' | 'date' | 'order' | 'createdAt' | 'updatedAt'>>({
    startTime: '',
    endTime: '',
    title: '',
    remarks: ''
  });

  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleAddSchedule = async () => {
    if (newSchedule.startTime && newSchedule.endTime && newSchedule.title) {
      try {
        // 시작 시간과 종료 시간이 같으면 종료 시간을 1시간 후로 설정
        let endTime = newSchedule.endTime;
        if (newSchedule.startTime === newSchedule.endTime) {
          const [hours, minutes] = newSchedule.startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + 60; // 1시간 추가
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
          
          // 사용자에게 알림
          alert(`시작 시간과 종료 시간이 같아서 종료 시간을 ${endTime}으로 자동 설정했습니다.`);
        }

        // API를 통한 스케줄 추가
        const scheduleData = {
          date: selectedDate.toISOString().split('T')[0],
          startTime: newSchedule.startTime,
          endTime: endTime,
          title: newSchedule.title,
          remarks: newSchedule.remarks || null
        };
        
        // 디버깅 로그 추가
        console.log('=== 스케줄 생성 디버깅 ===');
        console.log('선택된 날짜:', selectedDate);
        console.log('날짜 형식:', scheduleData.date);
        console.log('시작 시간:', scheduleData.startTime);
        console.log('종료 시간:', scheduleData.endTime);
        console.log('제목:', scheduleData.title);
        console.log('비고:', scheduleData.remarks);
        console.log('전체 데이터:', JSON.stringify(scheduleData, null, 2));
        
        await scheduleApi.createSchedule(scheduleData);
        
        // 부모 컴포넌트에 업데이트 알림
        if (onScheduleUpdate) {
          onScheduleUpdate(selectedDate);
        }
        
        setNewSchedule({
          startTime: '',
          endTime: '',
          title: '',
          remarks: ''
        });
        
        alert('스케줄이 추가되었습니다!');
      } catch (error) {
        console.error('스케줄 추가 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '스케줄 추가에 실패했습니다.';
        alert(`스케줄 추가 실패: ${errorMessage}`);
      }
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      // API를 통한 스케줄 삭제
      await scheduleApi.deleteSchedule(id.toString());
      
      // 로컬 상태 업데이트 제거 (API만 사용)
      
      // 부모 컴포넌트에 업데이트 알림
      if (onScheduleUpdate) {
        onScheduleUpdate(selectedDate);
      }
    } catch (error) {
      console.error('스케줄 삭제 실패:', error);
      alert('스케줄 삭제에 실패했습니다.');
    }
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (schedule: ScheduleItem) => {
    try {
      // API를 통한 스케줄 수정
      const scheduleData = {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        title: schedule.title,
        remarks: schedule.remarks
      };
      
      await scheduleApi.updateSchedule(schedule.id, scheduleData);
      
      // 로컬 상태 업데이트 제거 (API만 사용)
      
      // 부모 컴포넌트에 업데이트 알림
      if (onScheduleUpdate) {
        onScheduleUpdate(selectedDate);
      }
    } catch (error) {
      console.error('스케줄 수정 실패:', error);
      alert('스케줄 수정에 실패했습니다.');
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">스케줄 표시</h2>
      
      {/* 선택된 날짜 표시 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800">
          {formatDate(selectedDate)} 스케줄
        </h3>
      </div>

      {/* 스케줄 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">번호</th>
              <th className="text-left py-3 px-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                  시작
                </div>
              </th>
              <th className="text-left py-3 px-2">
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">
                  종료
                </div>
              </th>
              <th className="text-left py-3 px-2">
                <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-md text-sm font-medium">
                  제목
                </div>
              </th>
              <th className="text-left py-3 px-2">
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-medium">
                  비고
                </div>
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">작업</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule, index) => (
              <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-sm font-medium text-gray-700">
                  {index + 1}
                </td>
                <td className="py-3 px-2">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                    {schedule.startTime}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">
                    {schedule.endTime}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-md text-sm font-medium">
                    {schedule.title}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-medium">
                    {schedule.remarks}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {/* 빈 행들 */}
            {Array.from({ length: 6 - schedules.length }, (_, index) => (
              <tr key={`empty-${index}`} className="border-b border-gray-100">
                <td className="py-3 px-2 text-sm text-gray-400">
                  {schedules.length + index + 1}
                </td>
                <td className="py-3 px-2">
                  <div className="bg-blue-100 h-8 rounded-md"></div>
                </td>
                <td className="py-3 px-2">
                  <div className="bg-blue-100 h-8 rounded-md"></div>
                </td>
                <td className="py-3 px-2">
                  <div className="bg-blue-100 h-8 rounded-md"></div>
                </td>
                <td className="py-3 px-2">
                  <div className="bg-blue-100 h-8 rounded-md"></div>
                </td>
                <td className="py-3 px-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 스케줄 추가 폼 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-medium text-gray-800 mb-4">새 스케줄 추가</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={newSchedule.title}
            onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="스케줄 제목 *"
            required
          />
          <input
            type="text"
            value={newSchedule.remarks || ''}
            onChange={(e) => setNewSchedule({...newSchedule, remarks: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비고"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작 시간
            </label>
            <TimeInput
              value={newSchedule.startTime}
              onChange={(time) => setNewSchedule({...newSchedule, startTime: time})}
              placeholder="시작 시간"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료 시간
            </label>
            <TimeInput
              value={newSchedule.endTime}
              onChange={(time) => setNewSchedule({...newSchedule, endTime: time})}
              placeholder="종료 시간"
              required
            />
          </div>
        </div>
        <button
          onClick={handleAddSchedule}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          스케줄 추가
        </button>
      </div>

      {/* 편집 모달 */}
      <ScheduleEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ScheduleDisplay;
