import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 홈 화면인지 확인
  const isHomePage = location.pathname === '/';

  const handleBackClick = () => {
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* 홈 화면이 아닐 때만 뒤로 가기 버튼 표시 */}
      {!isHomePage && (
        <div 
          className="fixed top-4 right-4 z-50"
          style={{ zIndex: 9999 }}
        >
          <button
            type="button"
            onClick={handleBackClick}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
            title="뒤로 가기"
            style={{ 
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 9999,
              border: 'none',
              outline: 'none'
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default FloatingActionButton;
