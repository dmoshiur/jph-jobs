import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { LangProvider } from '@/hooks/useLang';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.jobhub.test';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Largest Job Site in Bangladesh, Search Jobs | jobhub', template: '%s | jobhub' },
  description: 'Find the right job in Bangladesh. Search live jobs, vacancies, companies and new jobs across Bogura, Joypurhat and all over Bangladesh.',
  keywords: ['Bangladesh jobs', 'bdjobs', 'jobhub', 'Bogura job', 'Joypurhat job', 'চাকরি', 'job portal Bangladesh'],
  openGraph: {
    title: 'Largest Job Site in Bangladesh, Search Jobs | jobhub',
    description: 'Find the right job. Live jobs, vacancies and companies in one place.',
    type: 'website',
    siteName: 'jobhub',
    locale: 'en_US'
  },
  twitter: { card: 'summary_large_image', title: 'jobhub', description: 'Find the right job in Bangladesh.' },
  robots: { index: true, follow: true }
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#00a0c6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LangProvider>
          <AuthProvider>
            <ToastProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
