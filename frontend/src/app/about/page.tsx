import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'About jobhub.com' };

export default function AboutPage() {
  return (
    <CmsPage title="About jobhub.com">
      <p>
        jobhub.com is Bangladesh&apos;s job marketplace — built with the same layout, colour system and
        browsing experience job seekers already know from bdjobs.com: find the right job, scan live
        vacancies, and apply online.
      </p>
      <h2>What you can do</h2>
      <ul>
        <li>Search live jobs by keyword, category, industry and location</li>
        <li>Browse government, overseas, internship and work-from-home openings</li>
        <li>Follow employer lists and featured / hot jobs</li>
        <li>Create a job-seeker or recruiter account and apply online</li>
      </ul>
      <h2>Contact centre</h2>
      <p>Available 9 am to 8 pm (Sat to Thurs).</p>
      <p><strong>16479</strong> · 09638 666 444 · 01897 627 858</p>
    </CmsPage>
  );
}
