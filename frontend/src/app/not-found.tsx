import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container section center" style={{ maxWidth: 560 }}>
      <h1>Page not found</h1>
      <p className="muted">The page you requested is not available. Browse live jobs or go back home.</p>
      <div className="flex gap-2" style={{ justifyContent: 'center' }}>
        <Link href="/" className="btn">Home</Link>
        <Link href="/jobs" className="btn btn-outline">Find Jobs</Link>
      </div>
    </div>
  );
}
