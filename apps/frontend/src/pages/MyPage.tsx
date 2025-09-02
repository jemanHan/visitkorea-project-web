import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile, changePassword, Me } from '../api/users';
import { getToken, clearToken } from '../auth/token';
import TopBar from '../components/layout/TopBar';

import MonthCalendar from '../components/calendar/MonthCalendar';

export default function MyPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [lang, setLang] = useState<'KR' | 'EN'>('KR');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 달력 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    // 로컬 시간대를 유지하면서 날짜만 추출
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    navigate(`/schedule?date=${formattedDate}`);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const data = await getMe();
        setMe(data);
        setDisplayName(data.displayName ?? '');
        setLang((data.lang as 'KR' | 'EN') ?? 'KR');
      } catch (e: any) {
        // 401 → token invalid/expired
        clearToken();
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({ displayName, lang });
      setMe(updated);
      alert('프로필이 저장되었습니다.');
    } catch (e: any) {
      alert(e?.response?.data?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        setPwSaving(false);
        return;
      }
      
      const ok = await changePassword({ currentPassword, newPassword });
      if (ok) {
        alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
        clearToken();
        navigate('/login', { replace: true });
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || '비밀번호 변경 실패');
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!me) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <TopBar />
      
      {/* 뒤로가기 버튼 - 우측 상단 고정 */}
      <button
        onClick={() => navigate(-1)}
        className="fixed right-4 z-40 btn btn-circle btn-sm bg-white/90 backdrop-blur shadow-lg hover:bg-white"
        style={{ top: '6rem' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      
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
            {me.displayName || me.email.split('@')[0]}님의 여행을 더욱 특별하게 만들어드릴게요.
          </p>
        </div>

        {/* 메인 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 왼쪽 컬럼 - 달력 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">my여행캘린더</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 text-sm">
                  일정이 없습니다.
                </p>
              </div>
              
              {/* 달력 컴포넌트 */}
              <MonthCalendar onDateSelect={handleDateClick} />
              
              {/* 스케줄 페이지로 가는 버튼 */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/schedule')}
                  className="btn btn-primary btn-sm w-full"
                >
                  📅 전체 스케줄 보기
                </button>
              </div>
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
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
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
                    이메일
                  </label>
                  <input
                    type="email"
                    value={me.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 프로필 수정 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">프로필 수정</h2>
              
              <form onSubmit={onSaveProfile} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">이름(닉네임)</span>
                  </label>
                  <input 
                    className="input input-bordered w-full" 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    placeholder="닉네임" 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">언어</span>
                  </label>
                  <select 
                    className="select select-bordered w-full" 
                    value={lang} 
                    onChange={e => setLang(e.target.value as 'KR' | 'EN')}
                  >
                    <option value="KR">한국어</option>
                    <option value="EN">English</option>
                  </select>
                </div>
                
                <button 
                  className="btn btn-primary w-full" 
                  disabled={saving}
                >
                  {saving ? '저장중...' : '프로필 저장'}
                </button>
              </form>
            </div>

            {/* 비밀번호 변경 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">비밀번호 변경</h2>
              
              <form onSubmit={onChangePassword} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">현재 비밀번호</span>
                  </label>
                  <input 
                    type="password" 
                    className="input input-bordered w-full" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">새 비밀번호</span>
                  </label>
                  <input 
                    type="password" 
                    className="input input-bordered w-full" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="새 비밀번호를 입력하세요"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">새 비밀번호 확인</span>
                  </label>
                  <input 
                    type="password" 
                    className="input input-bordered w-full" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                </div>
                
                <button 
                  className="btn btn-secondary w-full" 
                  disabled={pwSaving}
                >
                  {pwSaving ? '변경중...' : '비밀번호 변경'}
                </button>
              </form>
            </div>

            {/* 계정 관리 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">계정 관리</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    clearToken();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
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
    </div>
  );
}
