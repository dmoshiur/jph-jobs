import { api, API_URL } from '@/services/api';

/**
 * Server-side fetch helper for public data.
 * Uses revalidation so public pages stay fast and reasonably fresh.
 */
export async function fetchPublic<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const json = await res.json();
  return json.data as T;
}

export { api };
