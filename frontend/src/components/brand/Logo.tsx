import Link from 'next/link';

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  const color = light ? '#ffffff' : '#00a0c6';
  return (
    <Link href="/" className="bdj-logo" aria-label="jobhub home">
      <span className="bdj-logo-mark" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill={light ? '#1488b8' : '#00a0c6'} />
          <path d="M10 13.2a6 6 0 1 1 12 0v.4c1.4.6 2.4 1.8 2.4 3.4 0 2-1.9 3.6-4.4 3.6h-8c-2.5 0-4.4-1.6-4.4-3.6 0-1.6 1-2.8 2.4-3.4v-.4Z" fill="#fff" />
          <circle cx="16" cy="12.2" r="3.1" fill={light ? '#1488b8' : '#00a0c6'} />
        </svg>
      </span>
      <span className="bdj-wordmark" style={{ color }}>
        job<span>hub</span>
      </span>
      {!compact && <span className="sr-only">jobhub</span>}
    </Link>
  );
}
