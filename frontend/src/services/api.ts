import type { ApiResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1];
}

interface ApiOptions extends RequestInit { skipCsrf?: boolean }

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!options.skipCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrf = getCookie('csrfToken');
    if (csrf) headers.set('X-CSRF-Token', decodeURIComponent(csrf));
  }

  const response = await fetch(url, { ...options, method, headers, credentials: 'include' });
  const payload = (await response.json().catch(() => ({ success: false, message: 'Invalid server response', errors: {} }))) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload.data;
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'DELETE' })
};
