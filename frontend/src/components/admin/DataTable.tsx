'use client';

import { useState, type ReactNode } from 'react';
import { Pagination } from '@/components/ui/Pagination';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns, rows, total, page, pages, onPage, search, onSearch, actions, title
}: {
  columns: Column<T>[];
  rows: T[];
  total?: number;
  page?: number;
  pages?: number;
  onPage?: (p: number) => void;
  search?: string;
  onSearch?: (s: string) => void;
  actions?: ReactNode;
  title?: string;
}) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-h">
        <h3>{title}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onSearch && <input placeholder="খুঁজুন…" value={search} onChange={(e) => onSearch(e.target.value)} style={{ width: 200, padding: '7px 10px' }} />}
          {actions}
        </div>
      </div>
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table className="table">
          <thead>
            <tr>{columns.map((c) => <th key={c.key} className={c.className}>{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="center muted" style={{ padding: 32 }}>কোনো তথ্য নেই</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>{columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(row) : (row as any)[c.key]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {total !== undefined && <div className="panel-b" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-sm muted">মোট {total}</span>
        {pages && pages > 1 && onPage && <Pagination page={page ?? 1} pages={pages} onPage={onPage} />}
      </div>}
    </div>
  );
}

export function useSearch() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  if (typeof window !== 'undefined') {
    setTimeout(() => setDebounced(q), 0);
  }
  return { q, setQ, debounced };
}
