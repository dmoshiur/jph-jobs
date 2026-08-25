import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { LangProvider } from '@/hooks/useLang';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import { BackToTop } from '@/components/ui/BackToTop';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.jobhub.com.bd';

// Bdjobs.com exact metadata structure
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { 
    default: 'Largest Job Site in Bangladesh, Search Jobs | jobhub', 
    template: '%s | jobhub'
  },
  description: 'Find the right job in Bangladesh. Search live jobs, vacancies, companies and new jobs across all over Bangladesh.',
  keywords: [
    'Bangladesh jobs', 'bdjobs', 'jobhub', 'চাকরি', 'job portal Bangladesh',
    'career', 'employment', 'recruitment', 'job search', 'vacancy'
  ],
  authors: [{ name: 'jobhub' }],
  generator: 'jobhub - Largest Job Site in Bangladesh',
  applicationName: 'jobhub',
  referrer: 'origin-when-cross-origin',
  creator: 'jobhub',
  publisher: 'jobhub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Largest Job Site in Bangladesh, Search Jobs | jobhub',
    description: 'Find the right job. Live jobs, vacancies and companies in one place.',
    url: SITE_URL,
    siteName: 'jobhub',
    images: [
      {
        url: `${SITE_URL}/images/logo_bdesh.svg`,
        width: 200,
        height: 60,
        alt: 'jobhub Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'jobhub - Largest Job Site in Bangladesh',
    description: 'Find the right job in Bangladesh. Search live jobs, vacancies, companies.',
    images: [`${SITE_URL}/images/logo_bdesh.svg`],
    creator: '@jobhub',
    site: '@jobhub',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: 'jobhub',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0066cc',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts - Same as bdjobs.com */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* Meta Tags for SEO */}
        <meta name="copyright" content="jobhub" />
        <meta name="language" content="English, Bengali" />
        <meta name="country" content="Bangladesh" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        
        {/* Open Graph Additional */}
        <meta property="og:image:alt" content="jobhub - Find Your Dream Job" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Additional */}
        <meta name="twitter:site" content="@jobhub" />
        <meta name="twitter:creator" content="@jobhub" />
        
        {/* Canonical */}
        <link rel="canonical" href={SITE_URL} />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/roboto.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
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
        
        {/* Back to top button */}
        <BackToTop />
        
        {/* Live chat widget placeholder */}
        <div id="live-chat-widget" style={{ position: 'fixed', bottom: '20px', right: '80px', zIndex: 100 }} />
      </body>
    </html>
  );
}
