'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { isShopOwner } from '@/lib/ranks';
import type { Location } from '@/types/api';

export default function EmployerProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const shop = isShopOwner(user?.roles);
  const [locations, setLocations] = useState<Location[]>([]);
  const [f, setF] = useState({
    name: '', about: '', category: shop ? 'Shop' : '', address: '', phone: '', email: '', website: '',
    districtId: '', upazilaId: '', kind: shop ? 'shop' : 'company'
  });

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    api.get<{ districts: Location[] }>('/public/locations').then((d) => setLocations(d.districts)).catch(() => undefined);
  }, []);

  const district = locations.find((d) => d.id === f.districtId);

  async function save() {
    try {
      await api.post('/companies', f);
      toast(shop ? 'দোকান প্রোফাইল তৈরি হয়েছে' : 'কোম্পানি প্রোফাইল তৈরি হয়েছে', 'success');
      router.push('/dashboard/employer');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ব্যর্থ', 'error');
    }
  }

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 720 }}>
      <h1>{shop ? 'দোকান প্রোফাইল তৈরি করুন' : 'কোম্পানি প্রোফাইল তৈরি করুন'}</h1>
      <p className="muted">শুধু বগুড়া ও জয়পুরহাট। {shop ? 'দোকানের সেটিংস ও চাকরি পোস্ট করতে পারবেন।' : 'পরে MD, GM, AGM, DM, ACM র‍্যাঙ্কে টিম যোগ করুন।'}</p>
      <div className="panel card-pad">
        <label className="field"><span className="label">{shop ? 'দোকানের নাম' : 'কোম্পানির নাম'}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="field"><span className="label">ক্যাটাগরি</span><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder={shop ? 'Grocery / Pharmacy / Tailor' : 'IT / Agro / Hospital'} /></label>
        <label className="field"><span className="label">সম্পর্কে</span><textarea value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} /></label>
        <div className="grid grid-2">
          <label className="field"><span className="label">জেলা</span>
            <select value={f.districtId} onChange={(e) => setF({ ...f, districtId: e.target.value, upazilaId: '' })}>
              <option value="">নির্বাচন করুন</option>
              {locations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="field"><span className="label">উপজেলা</span>
            <select value={f.upazilaId} onChange={(e) => setF({ ...f, upazilaId: e.target.value })} disabled={!district}>
              <option value="">সব</option>
              {district?.children?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="field"><span className="label">ঠিকানা</span><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
          <label className="field"><span className="label">ফোন</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <label className="field"><span className="label">ইমেইল</span><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="field"><span className="label">ওয়েবসাইট</span><input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label>
        </div>
        <button className="btn" onClick={save}>সংরক্ষণ করুন</button>
      </div>
    </div>
  );
}
