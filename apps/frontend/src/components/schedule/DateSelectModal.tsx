import React, { useState } from 'react';

interface DateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  placeName: string;
}

const DateSelectModal: React.FC<DateSelectModalProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  placeName
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleConfirm = () => {
    onDateSelect(selectedDate);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          📅 스케줄 날짜 선택
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>{placeName}</strong>을(를) 스케줄에 추가할 날짜를 선택해주세요.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            날짜 선택
          </label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]} // 오늘 이후만 선택 가능
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
          >
            스케줄 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelectModal;

