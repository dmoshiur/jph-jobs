import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.jobhub.test';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'JOBHUB — বগুড়া ও জয়পুরহাটের চাকরি', template: '%s | JOBHUB' },
  description: 'বগুড়া ও জয়পুরহাটের স্থানীয় চাকরি, কোম্পানি ও ব্যবসা প্রতিষ্ঠানের বিশ্বস্ত জব পোর্টাল। হাজারো স্থানীয় চাকরির সুযোগ এক জায়গায়।',
  keywords: ['বগুড়া চাকরি', 'জয়পুরহাট চাকরি', 'Bogura job', 'Joypurhat job', 'চাকরি', 'job portal Bangladesh', 'local jobs'],
  openGraph: {
    title: 'JOBHUB — বগুড়া ও জয়পুরহাটের চাকরি',
    description: 'বগুড়া ও জয়পুরহাটের স্থানীয় চাকরি এক জায়গায়।',
    type: 'website',
    siteName: 'JOBHUB',
    locale: 'bn_BD'
  },
  twitter: { card: 'summary_large_image', title: 'JOBHUB', description: 'বগুড়া ও জয়পুরহাটের স্থানীয় চাকরি এক জায়গায়।' },
  robots: { index: true, follow: true }
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#1d4ed8' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        {/* Bengali web font (optional, loaded at runtime; system fonts used as fallback). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
