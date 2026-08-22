import Link from 'next/link';
import { packages } from './packages.data';

export const metadata = { title: 'প্যাকেজ ও মূল্য' };

export default function PricingPage() {
  return (
    <div className="container section" style={{ maxWidth: 1000 }}>
      <div className="center" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)' }}>প্যাকেজ ও মূল্য</h1>
        <p className="muted">আপনার নিয়োগ প্রয়োজন অনুযায়ী সেরা প্যাকেজ বেছে নিন।</p>
      </div>
      <div className="grid grid-3" style={{ gap: 18 }}>
        {packages.map((p) => (
          <div key={p.name} className="panel card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>{p.name}</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-700)', margin: '6px 0' }}>৳{p.price.toLocaleString('bn-BD')}</div>
            <div className="text-sm muted" style={{ marginBottom: 14 }}>{p.days} দিন</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, flex: 1 }}>
              {p.features.map((f) => <li key={f} style={{ display: 'flex', gap: 8, fontSize: '.9rem' }}><span style={{ color: 'var(--success-500)' }}>✓</span> {f}</li>)}
            </ul>
            <Link href="/auth/register" className={p.price === 0 ? 'btn btn-secondary btn-block' : 'btn btn-block'} style={{ marginTop: 16 }}>শুরু করুন</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
