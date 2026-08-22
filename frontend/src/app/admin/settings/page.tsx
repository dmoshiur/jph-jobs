'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

interface Setting { key: string; value: unknown; isSecret: boolean }
export default function AdminSettings() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Setting[]>([]);
  useEffect(() => { api.get<Setting[]>('/admin/settings').then(setRows).catch(() => undefined); }, []);
  async function save(key: string, value: unknown) {
    await api.patch(`/admin/settings/${key}`, { value });
    toast('সেটিং সংরক্ষিত', 'success');
  }
  return (
    <div className="panel card-pad">
      <h3>সাইট সেটিংস</h3>
      <div className="grid grid-2" style={{ gap: 14 }}>
        {rows.map((s) => (
          <label key={s.key} className="field">
            <span className="label">{s.key}</span>
            {typeof s.value === 'boolean'
              ? <input type="checkbox" style={{ width: 'auto' }} defaultChecked={s.value as boolean} onChange={(e) => save(s.key, e.target.checked)} />
              : typeof s.value === 'number'
                ? <input type="number" defaultValue={s.value as number} onBlur={(e) => save(s.key, Number(e.target.value))} />
                : <input defaultValue={String(s.value ?? '')} onBlur={(e) => save(s.key, e.target.value)} />}
          </label>
        ))}
      </div>
    </div>
  );
}
