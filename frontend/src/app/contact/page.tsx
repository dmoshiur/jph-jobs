import { CmsPage } from '@/components/cms/CmsPage';

export const metadata = { title: 'Contact Us' };

export default function Contact() {
  return (
    <CmsPage title="Contact Us">
      <p>Our Contact Centre is available from 9 am to 8 pm (Sat to Thurs).</p>
      <p><strong>16479</strong></p>
      <p><strong>09638 666 444</strong></p>
      <p><strong>01897 627 858</strong></p>
      <p>Email: support@jobhub.com</p>
      <p>Dhaka, Bangladesh</p>
    </CmsPage>
  );
}
