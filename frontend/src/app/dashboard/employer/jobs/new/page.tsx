'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import type { Category, Company, Location, PackagePlan } from '@/types/api';
import { IconCheck } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

const TYPES = [
  { v: 'FULL_TIME', l: 'ফুল টাইম' }, { v: 'PART_TIME', l: 'পার্ট টাইম' },
  { v: 'INTERNSHIP', l: 'ইন্টার্নশিপ' }, { v: 'CONTRACT', l: 'চুক্তি' },
  { v: 'TEMPORARY', l: 'অস্থায়ী' }, { v: 'REMOTE', l: 'রিমোট' }, { v: 'ON_SITE', l: 'অনসাইট' }
];
const STEPS = ['তথ্য', 'প্রয়োজনীয়তা', 'লোকেশন', 'প্যাকেজ', 'প্রিভিউ'];

export default function PostJobPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    companyId: '', categoryId: '', packageId: '', title: '', type: 'FULL_TIME', vacancy: 1,
    salaryMin: '', salaryMax: '', salaryText: '', experience: '', education: '',
    responsibilities: '', requirements: '', benefits: '',
    districtId: '', upazilaId: '', deadline: '', publishNow: false
  });

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/dashboard/employer/jobs/new');
    if (!user) return;
    Promise.all([
      api.get<Company[]>('/companies').catch(() => ({ items: [] })).then((r: any) => r.items ?? r),
      api.get<Category[]>('/public/categories'),
      api.get<{ districts: Location[] }>('/public/locations?popular=true').then((r) => r.districts),
      api.get<PackagePlan[]>('/packages')
    ]).then(([c, cat, loc, pk]) => { setCompanies(c as Company[]); setCategories(cat); setLocations(loc); setPackages(pk.filter((p) => p.type === 'JOB')); });
  }, [user, loading, router]);

  const selectedDistrict = locations.find((l) => l.id === form.districtId);
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function canProceed() {
    if (step === 0) return form.title && form.companyId && form.type && form.responsibilities;
    if (step === 1) return form.requirements;
    if (step === 2) return form.deadline;
    if (step === 3) return true;
    return true;
  }

  async function submit() {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        vacancy: Number(form.vacancy) || 1,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        deadline: new Date(form.deadline).toISOString(),
        publishNow: form.packageId ? false : form.publishNow
      };
      await api.post('/jobs', payload);
      toast('চাকরি সফলভাবে জমা হয়েছে! অনুমোদনের পর প্রকাশিত হবে।', 'success');
      router.push('/dashboard/employer');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'জমা ব্যর্থ', 'error');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 820 }}>
      <nav className="crumb"><Link href="/dashboard/employer">ড্যাশবোর্ড</Link> <span>/</span> <span>নতুন চাকরি</span></nav>
      <h1 style={{ fontSize: '1.5rem' }}>নতুন চাকরি পোস্ট করুন</h1>

      <div className="stepper" style={{ display: 'flex', gap: 6, margin: '16px 0 24px', overflowX: 'auto' }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className="btn btn-sm" style={{ background: i === step ? 'var(--primary-600)' : i < step ? 'var(--success-100)' : '#fff', color: i === step ? '#fff' : i < step ? 'var(--success-600)' : 'var(--gray-600)', border: '1px solid var(--border)' }}>
            {i < step ? <IconCheck width={14} height={14} /> : i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="panel card-pad">
        {step === 0 && (
          <div className="grid grid-2">
            <label className="field"><span className="label">কোম্পানি *</span>
              <select value={form.companyId} onChange={(e) => set('companyId', e.target.value)}>
                <option value="">নির্বাচন করুন</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {companies.length === 0 && <span className="form-help"><Link href="/dashboard/employer/profile">কোম্পানি প্রোফাইল তৈরি করুন</Link></span>}
            </label>
            <label className="field"><span className="label">ক্যাটাগরি</span>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">সাধারণ</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}><span className="label">পদের নাম *</span><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="যেমন: Sales Executive" /></label>
            <label className="field"><span className="label">চাকরির ধরন *</span>
              <select value={form.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
            </label>
            <label className="field"><span className="label">শূন্যপদ</span><input type="number" min={1} value={form.vacancy} onChange={(e) => set('vacancy', e.target.value)} /></label>
            <label className="field" style={{ gridColumn: '1 / -1' }}><span className="label">কাজের বিবরণ / দায়িত্ব *</span><textarea value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} rows={5} placeholder="প্রধান দায়িত্বসমূহ লিখুন..." /></label>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-2">
            <label className="field" style={{ gridColumn: '1 / -1' }}><span className="label">চাহিদা / যোগ্যতা *</span><textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} rows={5} /></label>
            <label className="field"><span className="label">অভিজ্ঞতা</span><input value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="যেমন: 1-2 বছর" /></label>
            <label className="field"><span className="label">শিক্ষা</span><input value={form.education} onChange={(e) => set('education', e.target.value)} placeholder="যেমন: স্নাতক" /></label>
            <label className="field"><span className="label">সর্বনিম্ন বেতন</span><input type="number" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} /></label>
            <label className="field"><span className="label">সর্বোচ্চ বেতন</span><input type="number" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} /></label>
            <label className="field" style={{ gridColumn: '1 / -1' }}><span className="label">বেতন টেক্সট (ঐচ্ছিক)</span><input value={form.salaryText} onChange={(e) => set('salaryText', e.target.value)} placeholder="যেমন: ৳১৫,০০০–৳২০,০০০" /></label>
            <label className="field" style={{ gridColumn: '1 / -1' }}><span className="label">সুবিধাদি</span><textarea value={form.benefits} onChange={(e) => set('benefits', e.target.value)} rows={3} /></label>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-2">
            <label className="field"><span className="label">জেলা</span>
              <select value={form.districtId} onChange={(e) => { set('districtId', e.target.value); set('upazilaId', ''); }}>
                <option value="">নির্বাচন করুন</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="field"><span className="label">উপজেলা</span>
              <select value={form.upazilaId} onChange={(e) => set('upazilaId', e.target.value)} disabled={!selectedDistrict}>
                <option value="">সব</option>
                {selectedDistrict?.children?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}><span className="label">আবেদনের শেষ তারিখ *</span><input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} min={new Date().toISOString().slice(0, 10)} /></label>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="muted">ফ্রি প্যাকেজে চাকরি অনুমোদনের পর প্রকাশিত হবে। ফিচার্ড/হট প্যাকেজে আরও বেশি প্রার্থী পৌঁছাবেন।</p>
            <div className="grid grid-3" style={{ gap: 12 }}>
              {packages.map((p) => (
                <button key={p.id} type="button" onClick={() => set('packageId', form.packageId === p.id ? '' : p.id)}
                  className="panel" style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: form.packageId === p.id ? '2px solid var(--primary-500)' : '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-700)' }}>৳{(p.price / 100).toLocaleString('bn-BD')}</div>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: '.85rem', color: 'var(--gray-600)' }}>
                    {p.features?.filter((f) => f.key !== 'tier').map((f) => <li key={f.id}>{f.value === '1' ? f.key.replace(/_/g, ' ') : `${f.key}: ${f.value}`}</li>)}
                  </ul>
                </button>
              ))}
            </div>
            {!form.packageId && <label className="check-row mt-4"><input type="checkbox" checked={form.publishNow} onChange={(e) => set('publishNow', e.target.checked)} /> অনুমোদনের পর সরাসরি প্রকাশ করুন</label>}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3>{form.title || 'পদের নাম'}</h3>
            <p className="muted">{companies.find((c) => c.id === form.companyId)?.name} · {TYPES.find((t) => t.v === form.type)?.l}</p>
            <div className="detail-meta" style={{ gridTemplateColumns: 'repeat(2,1fr)', display: 'grid', gap: 10 }}>
              <div className="dm"><div className="k">শূন্যপদ</div><div className="v">{form.vacancy}</div></div>
              <div className="dm"><div className="k">শেষ তারিখ</div><div className="v">{form.deadline}</div></div>
              <div className="dm"><div className="k">বেতন</div><div className="v">{form.salaryMin || form.salaryMax ? `${form.salaryMin ?? ''}–${form.salaryMax ?? ''}` : form.salaryText || 'আলোচনা'}</div></div>
              <div className="dm"><div className="k">প্যাকেজ</div><div className="v">{packages.find((p) => p.id === form.packageId)?.name ?? 'ফ্রি'}</div></div>
            </div>
            <h4 style={{ marginTop: 16 }}>দায়িত্ব</h4><p style={{ whiteSpace: 'pre-wrap' }}>{form.responsibilities}</p>
            <h4>যোগ্যতা</h4><p style={{ whiteSpace: 'pre-wrap' }}>{form.requirements}</p>
          </div>
        )}

        <div className="flex gap-2 mt-6" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← পেছনে</button>
          {step < STEPS.length - 1
            ? <button className="btn" onClick={() => canProceed() ? setStep((s) => s + 1) : toast('প্রয়োজনীয় তথ্য পূরণ করুন', 'error')}>পরবর্তী →</button>
            : <button className="btn btn-success" onClick={submit} disabled={submitting}>{submitting ? 'জমা হচ্ছে…' : 'চাকরি জমা দিন'}</button>}
        </div>
      </div>
    </div>
  );
}
