const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export async function api(path: string, { method = 'GET', body, headers = {} }: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
} = {}) {
  const token = localStorage.getItem('vk_token');
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}


