import Link from 'next/link';

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/" className={`bdj-brand ${light ? 'light' : ''}`} aria-label="jobhub.com - Largest Job Site in Bangladesh">
      <span className="bdj-brand-text">
        jobhub{!compact && <span className="bdj-brand-com">.com</span>}
      </span>
    </Link>
  );
}
