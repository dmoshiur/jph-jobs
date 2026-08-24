'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COPY, type Lang } from '@/i18n/copy';

type Copy = (typeof COPY)[Lang];

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Copy }>({
  lang: 'en',
  setLang: () => undefined,
  t: COPY.en
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = window.localStorage.getItem('jobhub-lang');
    if (saved === 'en' || saved === 'bn') setLangState(saved);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    window.localStorage.setItem('jobhub-lang', next);
    document.documentElement.lang = next === 'bn' ? 'bn' : 'en';
  }

  const value = useMemo(() => ({ lang, setLang, t: COPY[lang] }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
