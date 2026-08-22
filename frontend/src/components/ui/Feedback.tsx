import Link from 'next/link';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function JobCardSkeleton() {
  return (
    <div className="job-card">
      <div className="job-top">
        <Skeleton style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
        <div className="job-main" style={{ width: '100%' }}>
          <Skeleton className="skel-line lg w80" />
          <Skeleton className="skel-line w60" />
        </div>
      </div>
      <Skeleton className="skel-line w40" style={{ marginTop: 14 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Skeleton style={{ height: 36, flex: 1, borderRadius: 10 }} />
        <Skeleton style={{ height: 36, width: 90, borderRadius: 10 }} />
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'কোনো ফলাফল পাওয়া যায়নি',
  message = 'অন্য কীওয়ার্ড বা লোকেশন দিয়ে চেষ্টা করুন।',
  action
}: { title?: string; message?: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return (
    <div className="state card card-pad">
      <div className="state-icon" aria-hidden="true">🔍</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <div className="state-actions">
          {action.href ? <Link href={action.href} className="btn">{action.label}</Link> : <button className="btn" onClick={action.onClick}>{action.label}</button>}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'কিছু একটু সমস্যা হয়েছে',
  message = 'সার্ভারের সাথে যোগাযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
  onRetry
}: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="state card card-pad">
      <div className="state-icon" aria-hidden="true">⚠️</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && <div className="state-actions"><button className="btn" onClick={onRetry}>আবার চেষ্টা করুন</button></div>}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid" style={{ gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => <JobCardSkeleton key={i} />)}
    </div>
  );
}
