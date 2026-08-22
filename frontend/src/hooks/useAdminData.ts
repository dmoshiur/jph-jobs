'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';

export function useAdminData<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await api.get<T>(path)); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'লোড ব্যর্থ'); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
