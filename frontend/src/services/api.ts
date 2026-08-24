import type { ApiResponse } from '@/types/api';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  status: number;
  errors: unknown;
  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface ApiOptions extends RequestInit { auth?: boolean; _retry?: boolean }

/**
 * Resolve the current Firebase ID token (if signed in). Loaded lazily so this
 * module stays usable in server components that only hit public endpoints.
 */
async function getIdToken(forceRefresh = false): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const { firebaseAuth, isFirebaseConfigured } = await import('./firebase');
    if (!isFirebaseConfigured()) return undefined;
    const user = firebaseAuth().currentUser;
    if (!user) return undefined;
    return await user.getIdToken(forceRefresh);
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  // Attach the Firebase ID token as a Bearer credential.
  const token = await getIdToken(options._retry);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, method, headers });

  // On 401, force-refresh the token once and retry (handles expiry).
  if (response.status === 401 && !options._retry && token) {
    return request<T>(path, { ...options, _retry: true });
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
