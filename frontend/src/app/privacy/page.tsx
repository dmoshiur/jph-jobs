import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  return (
    <CmsPage title="Privacy Policy">
      <p>We collect account details, CVs and application data only to operate the job marketplace. We do not sell personal information. Recruiter-posted job content is the responsibility of the hiring organisation.</p>
    </CmsPage>
  );
}
