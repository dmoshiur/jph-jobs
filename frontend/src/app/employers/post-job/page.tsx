import Link from 'next/link';
import { IconCheck, IconBriefcase, IconUsers, IconChart } from '@/components/ui/Icons';

export const metadata = { title: 'চাকরি পোস্ট করুন' };

export default function PostJobLanding() {
  return (
    <div className="container section" style={{ maxWidth: 960 }}>
      <div className="center" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)' }}>মাত্র কয়েক মিনিটে যোগ্য প্রার্থী খুঁজুন</h1>
        <p className="muted" style={{ maxWidth: 580, margin: '0 auto 18px' }}>বগুড়া ও জয়পুরহাটের স্থানীয় প্রার্থীদের কাছে আপনার চাকরি পৌঁছে দিন। ফ্রি প্যাকেজে শুরু করুন।</p>
        <Link href="/dashboard/employer/jobs/new" className="btn btn-lg">এখনই চাকরি পোস্ট করুন</Link>
      </div>
      <div className="grid grid-3">
        {[
          { icon: <IconUsers />, t: 'লক্ষ লক্ষ প্রার্থী', d: 'স্থানীয় দক্ষ ও অভিজ্ঞ প্রার্থীদের কাছে পৌঁছান।' },
          { icon: <IconBriefcase />, t: 'সহজ প্রক্রিয়া', d: 'কয়েকটি ধাপে চাকরি পোস্ট করুন ও আবেদন গ্রহণ করুন।' },
          { icon: <IconChart />, t: 'স্মার্ট ম্যানেজমেন্ট', d: 'আবেদন পরিচালনা, শর্টলিস্ট ও যোগাযোগ এক জায়গায়।' }
        ].map((f) => (
          <div key={f.t} className="card card-pad center">
            <div className="sc-ic" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', margin: '0 auto 12px' }}>{f.icon}</div>
            <h3>{f.t}</h3><p>{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
