import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../../hooks/useSchedule';
import TimeInput from './TimeInput';

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
  onSave: (schedule: ScheduleItem) => void;
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSave
}) => {
  const [formData, setFormData] = useState<ScheduleItem>({
    id: '',
    userId: '',
    date: '',
    startTime: '',
    endTime: '',
    title: '',
    remarks: '',
    order: 0,
    createdAt: '',
    updatedAt: ''
  });

  useEffect(() => {
    if (schedule) {
      setFormData(schedule);
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startTime && formData.endTime) {
      // 시작 시간과 종료 시간이 같으면 종료 시간을 1시간 후로 설정
      let endTime = formData.endTime;
      if (formData.startTime === formData.endTime) {
        const [hours, minutes] = formData.startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + 60; // 1시간 추가
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        
        // 사용자에게 알림
        alert(`시작 시간과 종료 시간이 같아서 종료 시간을 ${endTime}으로 자동 설정했습니다.`);
      }

      const updatedData = {
        ...formData,
        endTime: endTime
      };

      onSave(updatedData);
      onClose();
    }
  };

  const handleChange = (field: keyof ScheduleItem, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          스케줄 편집
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작 시간
            </label>
            <TimeInput
              value={formData.startTime}
              onChange={(time) => handleChange('startTime', time)}
              placeholder="시작 시간"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료 시간
            </label>
            <TimeInput
              value={formData.endTime}
              onChange={(time) => handleChange('endTime', time)}
              placeholder="종료 시간"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="스케줄 제목"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비고
            </label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="활동 내용"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleEditModal;
