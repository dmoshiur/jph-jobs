import type { ApiResponse } from '@/types/api';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}

export class ApiError extends Error {
  status: number;
  errors: unknown;
  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface ApiOptions extends RequestInit { skipCsrf?: boolean; _retry?: boolean }

let refreshPromise: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => { setTimeout(() => { refreshPromise = null; }, 0); });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!options.skipCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrf = getCookie('csrfToken');
    if (csrf) headers.set('X-CSRF-Token', decodeURIComponent(csrf));
  }

  let response = await fetch(url, { ...options, method, headers, credentials: 'include' });

  // Attempt one silent token refresh on 401.
  if (response.status === 401 && !options._retry && method.toUpperCase() !== 'POST' && !path.includes('/auth/')) {
    const ok = await refreshSession();
    if (ok) {
      return request<T>(path, { ...options, _retry: true });
    }
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('Invalid server response', response.status);
  }
  if (!response.ok || !payload.success) {
    const errors = (payload as { errors?: unknown }).errors;
    throw new ApiError(payload.message || 'Request failed', response.status, errors);
  }
  return payload.data;
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'DELETE' })
};

export function buildQuery(params: Record<string, unknown>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}
