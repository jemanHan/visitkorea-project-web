// API 클라이언트 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://13.209.108.148:3002';

// API 요청 헬퍼 함수
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // 로컬 스토리지에서 토큰 가져오기 (vk_token 키 사용)
    this.token = localStorage.getItem('vk_token');
  }

  // 토큰 설정
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('vk_token', token);
    } else {
      localStorage.removeItem('vk_token');
    }
  }

  // 기본 요청 헤더
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 현재 토큰을 다시 가져와서 확인 (vk_token 키 사용)
    const currentToken = localStorage.getItem('vk_token');
    console.log('JWT Token 확인:', currentToken ? '존재함' : '없음');
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
      console.log('Authorization 헤더 설정됨');
    } else {
      console.warn('JWT 토큰이 없습니다!');
    }

    return headers;
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // POST 요청
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();
    const body = data ? JSON.stringify(data) : undefined;
    
    console.log('=== ApiClient POST 요청 ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== API 에러 응답 ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Body:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API 응답 성공:', result);
    return result;
  }

  // PUT 요청
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

// 스케줄 관련 API 함수들
export const scheduleApi = {
  // 스케줄 목록 조회
  getSchedules: (date?: string) => {
    const endpoint = date ? `/v1/schedules/${date}` : '/v1/schedules';
    return apiClient.get(endpoint);
  },

  // 스케줄 상세 조회
  getSchedule: (id: string) => {
    return apiClient.get(`/v1/schedules/${id}`);
  },

  // 스케줄 생성
  createSchedule: (scheduleData: any) => {
    return apiClient.post('/v1/schedules', scheduleData);
  },

  // 스케줄 수정
  updateSchedule: (id: string, scheduleData: any) => {
    return apiClient.put(`/v1/schedules/${id}`, scheduleData);
  },

  // 스케줄 삭제
  deleteSchedule: (id: string) => {
    return apiClient.delete(`/v1/schedules/${id}`);
  },

  // 스케줄 일괄 저장
  saveAllSchedules: (scheduleData: any) => {
    return apiClient.post('/v1/schedules/batch', scheduleData);
  },
};

// 인증 관련 API 함수들
export const authApi = {
  // 로그인
  login: (credentials: { email: string; password: string }) => {
    return apiClient.post('/api/auth/login', credentials);
  },

  // 회원가입
  register: (userData: { email: string; password: string; name: string }) => {
    return apiClient.post('/api/auth/register', userData);
  },

  // 로그아웃
  logout: () => {
    apiClient.setToken(null);
  },

  // 토큰 검증
  verifyToken: () => {
    return apiClient.get('/api/auth/verify');
  },
};

export default apiClient;
