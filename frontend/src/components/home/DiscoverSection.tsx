'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/types/api';
import { useLang } from '@/hooks/useLang';
import { CAT_META } from '@/lib/demo-data';
import { formatCount } from '@/lib/format';

export function DiscoverSection({
  categories,
  industries,
}: {
  categories: Category[];
  industries: Category[];
}) {
  const { lang, t } = useLang();
  const [tab, setTab] = useState<'category' | 'industry'>('category');
  const [more, setMore] = useState(false);
  const list = tab === 'category' ? categories : industries;
  const shown = more ? list : list.slice(0, 24);

  return (
    <section className="bdj-discover">
      <h2>{t.discover}</h2>
      <div className="bdj-tabs">
        <button type="button" className={tab === 'category' ? 'on' : ''} onClick={() => { setTab('category'); setMore(false); }}>
          {t.category}
        </button>
        <button type="button" className={tab === 'industry' ? 'on' : ''} onClick={() => { setTab('industry'); setMore(false); }}>
          {t.industry}
        </button>
      </div>
      <div className="bdj-cat-grid">
        {shown.map((c) => {
          const meta = CAT_META[c.slug] ?? { color: '#0072bc', icon: '•' };
          return (
            <Link key={c.slug || c.id} href={`/jobs?category=${c.slug}`} className="bdj-cat">
              <span className="bdj-cat-ic" style={{ background: meta.color }}>{meta.icon}</span>
              <span className="bdj-cat-name">{c.name}</span>
              <span className="bdj-cat-n">({formatCount(c.jobCount, lang)})</span>
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
