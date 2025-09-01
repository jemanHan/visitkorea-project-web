import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'visitkorea_auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // 로컬 스토리지에서 인증 상태 로드
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        setAuthState({
          user: parsedAuth.user,
          isAuthenticated: !!parsedAuth.user,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to parse saved auth:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 인증 상태를 로컬 스토리지에 저장
  const saveAuthState = (newAuthState: AuthState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuthState));
    setAuthState(newAuthState);
  };

  // 로그인 함수
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // TODO: 실제 로그인 API 호출
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      
      // 임시 로그인 로직 (실제로는 API 호출)
      if (email && password) {
        const user: User = {
          id: '1',
          name: email.split('@')[0], // 임시로 이메일에서 이름 추출
          email: email
        };
        
        const newAuthState: AuthState = {
          user,
          isAuthenticated: true,
          isLoading: false
        };
        
        saveAuthState(newAuthState);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // 회원가입 함수
  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // TODO: 실제 회원가입 API 호출
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password })
      // });
      
      // 임시 회원가입 로직 (실제로는 API 호출)
      if (name && email && password) {
        const user: User = {
          id: Date.now().toString(), // 임시 ID 생성
          name,
          email
        };
        
        const newAuthState: AuthState = {
          user,
          isAuthenticated: true,
          isLoading: false
        };
        
        saveAuthState(newAuthState);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // 로그아웃 함수
  const logout = () => {
    const newAuthState: AuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false
    };
    
    saveAuthState(newAuthState);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    ...authState,
    login,
    signup,
    logout
  };
};
