'use client';

import { useLang } from '../lang';
import { STRINGS } from '../strings';
import { focusRing } from './Dialog';
import { iconButton } from './TopBar';

export function LangToggle() {
  const { lang, setLang } = useLang();
  const s = STRINGS[lang];
  return (
    <button
      type="button"
      data-testid="lang-toggle"
      aria-label={s.langAria}
      title={s.langAria}
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      className={`${iconButton} font-mono text-[13px] font-bold tracking-wider ${focusRing}`}
    >
      <span lang={lang === 'en' ? 'es' : 'en'}>{s.langButton}</span>
    </button>
  );
}
