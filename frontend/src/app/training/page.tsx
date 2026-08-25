import Link from 'next/link';
import { DEMO_COURSES } from '@/lib/demo-data';
import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'E-LEARNING' };

export default function Training() {
  return (
    <CmsPage title="E-LEARNING">
      <p>Get real-time skill updates — professional courses for job seekers and hiring teams.</p>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        {DEMO_COURSES.map((c) => (
          <div key={c.title} className="elearn-card">
            <h4>{c.title}</h4>
            <p>{c.price} · Instructor: {c.instructor}</p>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 18 }}><Link href="/jobs" className="btn">Browse jobs</Link></p>
    </CmsPage>
  );
}
