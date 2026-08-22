import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: { default: 'JPH Jobs — Bogura & Joypurhat Jobs', template: '%s | JPH Jobs' },
  description: 'Hyper-local jobs, companies and business directory platform for Bogura and Joypurhat, Bangladesh.',
  openGraph: { title: 'JPH Jobs', description: 'Local jobs and company profiles for Bogura and Joypurhat.', type: 'website' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <footer className="footer"><div className="container">© {new Date().getFullYear()} JPH Jobs. Frontend on Netlify, backend on Vercel.</div></footer>
        </AuthProvider>
      </body>
    </html>
  );
}
