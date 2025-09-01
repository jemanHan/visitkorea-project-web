import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import TopBar from '../components/layout/TopBar';
import FloatingActionButton from '../components/layout/FloatingActionButton';
import MonthCalendar from '../components/calendar/MonthCalendar';
import { useNavigate } from 'react-router-dom';

const MyPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // 로그인하지 않은 경우 테스트용 임시 사용자 정보 사용
  const testUser = !isAuthenticated ? {
    id: 'test',
    name: '테스트 사용자',
    email: 'test@example.com'
  } : user;



  // 달력 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    // 스케줄러 페이지로 이동하면서 선택된 날짜 전달
    const formattedDate = date.toISOString().split('T')[0];
    navigate(`/schedule?date=${formattedDate}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="container mx-auto px-4 py-6">
        {/* 상단 헤더 */}
        <div className="mb-6">
          <div className="inline-block bg-gray-200 rounded-lg px-4 py-2 text-sm font-medium">
            My마이페이지
          </div>
        </div>

        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            반가워요!
          </h1>
          <p className="text-gray-600">
            {testUser?.name}님의 여행을 더욱 특별하게 만들어드릴게요.
          </p>
        </div>

        {/* 메인 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 왼쪽 컬럼 - 달력 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">my여행캘린더</h2>
                <button
                  onClick={() => navigate('/schedule')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  일정추가
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 text-sm">
                  일정이 없습니다.
                </p>
              </div>
              
              {/* 달력 컴포넌트 */}
              <MonthCalendar onDateSelect={handleDateClick} />
            </div>


          </div>

          {/* 오른쪽 컬럼 - 사이드바 */}
          <div className="space-y-6">
            
            {/* 회원 정보 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">회원 정보</h2>
              
              {/* 프로필 이미지 */}
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
                    {testUser?.profileImage ? (
                      <img 
                        src={testUser.profileImage} 
                        alt="프로필" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-xs">
                    프로필 사진 변경
                  </button>
                </div>
              </div>

              {/* 사용자 정보 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    defaultValue={testUser?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    defaultValue={testUser?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="이메일을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="새 비밀번호를 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                </div>

                <button className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors font-medium text-sm">
                  정보 수정
                </button>
              </div>
            </div>

            {/* 계정 관리 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">계정 관리</h2>
              
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  닉네임 변경
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  설정
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  로그아웃
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  회원탈퇴
                </button>
              </div>
            </div>


          </div>
                 </div>
       </div>
       <FloatingActionButton />
     </div>
   );
 };

export default MyPage;
