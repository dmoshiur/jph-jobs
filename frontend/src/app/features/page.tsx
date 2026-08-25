import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'List of Features' };

export default function FeaturesPage() {
  return (
    <CmsPage title="List of Features">
      <ul>
        <li>Live jobs, vacancies, companies and new-jobs counters</li>
        <li>Keyword search with category, industry and location filters</li>
        <li>Quick links: deadline tomorrow, internship, contractual, part-time, overseas, WFH, fresher</li>
        <li>Government jobs ticker and overseas jobs by country</li>
        <li>Hot Jobs employer grid</li>
        <li>Apply Online, save job, recruiter posting and packages</li>
        <li>English / বাংলা language switch</li>
      </ul>
    </CmsPage>
  );
}
