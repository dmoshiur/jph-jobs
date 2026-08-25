import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'FAQ' };

export default function FaqPage() {
  return (
    <CmsPage title="Frequently Asked Questions">
      <h2>How do I apply for a job?</h2>
      <p>Open any circular, click <strong>Apply Online</strong>, sign in, and submit. Your profile CV is attached automatically.</p>
      <h2>What is the difference between category jobs and Hot Jobs?</h2>
      <p>Category jobs sit under their functional category. Hot Jobs appear on the homepage with the employer logo and get much higher visibility.</p>
      <h2>How do recruiters post a job?</h2>
      <p>Create a recruiter account, choose a package, and use Post a Job. You can manage applicants from the recruiter dashboard.</p>
      <h2>Is there an app?</h2>
      <p>Yes — job seeker and employer apps are listed in the footer (Google Play, App Store, AppGallery).</p>
    </CmsPage>
  );
}
