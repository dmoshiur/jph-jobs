'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { uploadToCloudinary } from '@/services/upload';
import { useToast } from '@/components/ui/Toast';

export default function CVBuilderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>({ title: '', summary: '', expectedSalary: '', yearsExperience: '', educationLevel: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'cv');
      await api.patch('/candidates/me', { cvObjectKey: result.publicId });
      setProfile((p: any) => ({ ...p, cvObjectKey: result.publicId }));
      toast('সিভি আপলোড হয়েছে', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'আপলোড ব্যর্থ', 'error');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/dashboard/cv');
    if (user) api.get<any>('/candidates/me').then(setProfile).catch(() => undefined);
  }, [user, loading, router]);

  async function save() {
    setSaving(true);
    try {
      await api.patch('/candidates/me', {
        title: profile.title, summary: profile.summary,
        expectedSalary: profile.expectedSalary ? Number(profile.expectedSalary) : undefined,
        yearsExperience: profile.yearsExperience ? Number(profile.yearsExperience) : undefined,
        educationLevel: profile.educationLevel
      });
      toast('প্রোফাইল সংরক্ষিত হয়েছে', 'success');
    } catch (e) { toast(e instanceof Error ? e.message : 'ব্যর্থ', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 760 }}>
      <h1 style={{ fontSize: '1.5rem' }}>আমার সিভি / প্রোফাইল</h1>
      <p className="muted">আপনার প্রোফাইল সম্পূর্ণ করলে নিয়োগদাতারা আপনাকে সহজে খুঁজে পাবেন।</p>
      <div className="panel card-pad">
        <div className="grid grid-2">
          <label className="field"><span className="label">পেশাগত শিরোনাম</span><input value={profile.title ?? ''} onChange={(e) => setProfile({ ...profile, title: e.target.value })} placeholder="যেমন: Sales Executive" /></label>
          <label className="field"><span className="label">শিক্ষা</span><input value={profile.educationLevel ?? ''} onChange={(e) => setProfile({ ...profile, educationLevel: e.target.value })} /></label>
          <label className="field"><span className="label">অভিজ্ঞতা (বছর)</span><input type="number" value={profile.yearsExperience ?? ''} onChange={(e) => setProfile({ ...profile, yearsExperience: e.target.value })} /></label>
          <label className="field"><span className="label">প্রত্যাশিত বেতন</span><input type="number" value={profile.expectedSalary ?? ''} onChange={(e) => setProfile({ ...profile, expectedSalary: e.target.value })} /></label>
        </div>
        <label className="field"><span className="label">নিজের সম্পর্কে</span><textarea value={profile.summary ?? ''} onChange={(e) => setProfile({ ...profile, summary: e.target.value })} rows={5} /></label>
        <div className="flex gap-2">
          <button className="btn" onClick={save} disabled={saving}>{saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}</button>
        </div>
        <div className="field mt-4">
          <span className="label">সিভি আপলোড (PDF/DOC)</span>
          <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={uploadCv} disabled={uploading} />
          {uploading && <span className="form-help">আপলোড হচ্ছে…</span>}
          {profile.cvObjectKey && !uploading && <span className="form-help">✅ সিভি সংযুক্ত আছে</span>}
        </div>
        <p className="form-help mt-4">📄 সিভি ও ছবি Cloudinary-তে নিরাপদে সংরক্ষিত হয়।</p>
      </div>
    </div>
  );
}
