import Link from 'next/link';
import { packages } from './packages.data';

export const metadata = { title: 'Products / Service' };

export default function PricingPage() {
  return (
    <div className="container section" style={{ maxWidth: 1000 }}>
      <div className="center" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)' }}>Products / Service</h1>
        <p className="muted">Choose a recruiter package to post jobs and manage hiring.</p>
      </div>
      <div className="grid grid-3" style={{ gap: 18 }}>
        {packages.map((p) => (
          <div key={p.name} className="panel card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>{p.name}</h3>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--bdj-blue)', margin: '6px 0' }}>
              ৳{p.price.toLocaleString('en-US')}
            </div>
            <div className="text-sm muted" style={{ marginBottom: 14 }}>{p.days} days</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, flex: 1 }}>
              {p.features.map((f) => <li key={f} style={{ display: 'flex', gap: 8, fontSize: '.9rem' }}><span style={{ color: 'var(--bdj-green)' }}>✓</span> {f}</li>)}
            </ul>
            <Link href="/auth/register?type=employer" className={p.price === 0 ? 'btn btn-secondary btn-block' : 'btn btn-block'} style={{ marginTop: 16 }}>
              Get started
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
