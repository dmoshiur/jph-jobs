import Link from 'next/link';
import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'jobhub Pro' };

export default function ProPage() {
  return (
    <CmsPage title="jobhub Pro" crumb="jobhub Pro">
      <p>Priority visibility, CV highlights and recruiter tools — the same product family job seekers expect from a national job site.</p>
      <Link href="/pricing" className="btn">View packages</Link>
    </CmsPage>
  );
}
