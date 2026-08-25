import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'Terms & Conditions' };

export default function Terms() {
  return (
    <CmsPage title="Terms & Conditions">
      <p>By using jobhub.com you agree to provide accurate information, not to post fraudulent vacancies, and to treat candidate data as confidential. jobhub.com is not a party to employment contracts between seekers and employers.</p>
    </CmsPage>
  );
}
