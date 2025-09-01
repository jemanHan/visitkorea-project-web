import { api } from './http.js';

export interface SignupData {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  return api('/v1/auth/signup', {
    method: 'POST',
    body: data
  });
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return api('/v1/auth/login', {
    method: 'POST',
    body: data
  });
}

export function logout() {
  localStorage.removeItem('vk_token');
  window.location.reload();
}

export function getToken(): string | null {
  return localStorage.getItem('vk_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}


