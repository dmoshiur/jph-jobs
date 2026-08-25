'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/types/api';
import { useLang } from '@/hooks/useLang';
import { CategoryIcons } from '@/components/CategoryIcons';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { t } = useLang();
  const [more, setMore] = useState(false);
  const list = useMemo(() => categories, [categories]);
  const shown = more ? list : list.slice(0, 24);

  if (!list.length) {
    return (
      <section className="bdj-discover">
        <h2>{t.discover || 'Discover Jobs Across Popular Category & Industry'}</h2>
        <p className="muted mb-0">Categories will appear here as jobs are posted.</p>
      </section>
    );
  }

  return (
    <section className="bdj-discover">
      <h2>{t.discover || 'Discover Jobs Across Popular Category & Industry'}</h2>
      <div className="bdj-cat-grid">
        {shown.map((c) => {
          const Icon = CategoryIcons[c.slug as keyof typeof CategoryIcons] || CategoryIcons.default;
          return (
            <Link key={c.slug || c.id} href={`/jobs?category=${c.slug}`} className="bdj-cat">
              <span className="bdj-cat-ic"><Icon /></span>
              <span className="bdj-cat-name">{c.name}</span>
              <span className="bdj-cat-n">({c.jobCount})</span>
            </Link>
          );
        })}
      </div>
      {list.length > 24 && (
        <button type="button" className="bdj-more" onClick={() => setMore((v) => !v)}>
          {more ? t.less : t.more}
        </button>
      )}
    </section>
  );
}
