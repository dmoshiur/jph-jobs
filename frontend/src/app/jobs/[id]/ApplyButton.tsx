'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { IconCheck } from '@/components/ui/Icons';

export function ApplyButton({ jobId, deadline, compact = false }: { jobId: string; deadline: string; compact?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const expired = new Date(deadline).getTime() < Date.now();

  async function submit() {
    setSubmitting(true);
    try {
      await api.post('/applications', { jobId, coverLetter: coverLetter || undefined });
      setDone(true);
      toast('Application submitted successfully', 'success');
      setOpen(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { router.push(`/auth/login?next=/jobs/${jobId}`); return; }
      toast(e instanceof Error ? e.message : 'Could not apply. Please sign in.', 'error');
    } finally { setSubmitting(false); }
  }

  if (done) {
    return <button className="btn btn-success btn-block" disabled><IconCheck width={16} height={16} /> Applied</button>;
  }
  if (expired) return <button className="btn btn-block" disabled>Deadline over</button>;

  return (
    <>
      <button
        className={`btn btn-apply btn-block ${compact ? '' : 'btn-lg'}`}
        onClick={() => { if (!user) { router.push(`/auth/login?next=/jobs/${jobId}`); return; } setOpen(true); }}
      >
        Apply Online
      </button>

      {open && (
        <div className="drawer-backdrop open" onClick={() => setOpen(false)} style={{ zIndex: 100 }}>
          <div className="panel" onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(520px, 92vw)', maxHeight: '90vh', overflow: 'auto', zIndex: 101, padding: 0 }}>
            <div className="panel-h"><h3>Apply Online</h3><button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button></div>
            <div className="panel-b">
              <p className="text-sm muted">Your profile CV will be attached. Add a cover letter (optional).</p>
              <label className="field">
                <span className="label">Cover letter</span>
                <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Why you are a good fit..." maxLength={5000} />
              </label>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => setOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-apply" onClick={submit} disabled={submitting} style={{ flex: 2 }}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
