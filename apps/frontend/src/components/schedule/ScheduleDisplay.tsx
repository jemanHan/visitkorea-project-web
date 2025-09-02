import React, { useState, useEffect } from 'react';
import { useSchedule, ScheduleItem } from '../../hooks/useSchedule';
import ScheduleEditModal from './ScheduleEditModal';

interface ScheduleDisplayProps {
  selectedDate: Date;
  initialPlaceName?: string;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ selectedDate, initialPlaceName }) => {
  const { getSchedulesForDate, addSchedule, deleteSchedule, updateSchedule } = useSchedule();
  const schedules = getSchedulesForDate(selectedDate);



  // initialPlaceName이 변경될 때 newSchedule의 googleApiData 업데이트
  useEffect(() => {
    if (initialPlaceName) {
      setNewSchedule(prev => ({
        ...prev,
        googleApiData: initialPlaceName
      }));
    }
  }, [initialPlaceName]);

  const [newSchedule, setNewSchedule] = useState<Omit<ScheduleItem, 'id'>>({
    startTime: '',
    endTime: '',
    googleApiData: initialPlaceName || '',
    remarks: ''
  });

  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleAddSchedule = () => {
    if (newSchedule.startTime && newSchedule.endTime) {
      addSchedule(selectedDate, newSchedule);
      setNewSchedule({
        startTime: '',
        endTime: '',
        googleApiData: '',
        remarks: ''
      });
    }
  };

  const handleDeleteSchedule = (id: number) => {
    deleteSchedule(selectedDate, id);
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (schedule: ScheduleItem) => {
    updateSchedule(selectedDate, schedule.id, {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      googleApiData: schedule.googleApiData,
      remarks: schedule.remarks
    });
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
                  구글 API 데이터
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
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-sm font-medium text-gray-700">
                  {schedule.id}
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
                    {schedule.googleApiData}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            type="time"
            value={newSchedule.startTime}
            onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="시작 시간"
          />
          <input
            type="time"
            value={newSchedule.endTime}
            onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="종료 시간"
          />
          <input
            type="text"
            value={newSchedule.googleApiData}
            onChange={(e) => setNewSchedule({...newSchedule, googleApiData: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="구글 API 데이터"
          />
          <input
            type="text"
            value={newSchedule.remarks}
            onChange={(e) => setNewSchedule({...newSchedule, remarks: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비고"
          />
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
