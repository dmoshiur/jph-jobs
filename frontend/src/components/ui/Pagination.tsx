'use client';

export function Pagination({
  page, pages, onPage
}: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: (number | '…')[] = [];
  const add = (n: number | '…') => nums.push(n);
  const window = 1;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - window && i <= page + window)) add(i);
    else if (nums[nums.length - 1] !== '…') add('…');
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}>‹</button>
      {nums.map((n, i) =>
        n === '…' ? <span key={`e${i}`} className="muted" style={{ padding: '0 4px' }}>…</span>
          : <button key={n} className={n === page ? 'active' : ''} onClick={() => onPage(n)}>{n}</button>
      )}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages}>›</button>
    </nav>
  );
}
