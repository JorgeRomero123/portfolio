'use client';

// "For people who won't play": the fast, server-rendered overview under the game stage.
// A client component only so it follows the language toggle; it renders fully on the server
// (initial lang from Accept-Language), needs no JS and never shows TODO placeholders.
import { GAME_CONTENT, SECTIONS, isExternal, links, text } from './content';
import { useLang } from './lang';
import { FLOW_STRINGS } from './strings';
import { focusRing } from './hud/Dialog';

const { summary, contact, intro } = GAME_CONTENT;

/** First `n` sentences of a paragraph (for the compact cards). */
function lead(text: string, n = 2) {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡“"])/);
  return parts.slice(0, n).join(' ');
}

export default function Overview() {
  const { lang } = useLang();
  const f = FLOW_STRINGS[lang];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* ── The short version ─────────────────────────────────────────────── */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0070f3]">{summary.kicker[lang]}</p>
          <h2 id="overview-title" className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {summary.heading[lang]}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-700 sm:text-xl">{summary.role[lang]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${contact.email}`}
              className={`inline-flex min-h-12 items-center rounded-xl bg-[#0070f3] px-5 text-[15px] font-semibold text-white shadow-md transition-[background-color,transform] duration-300 hover:scale-[1.02] hover:bg-[#0060d0] ${focusRing}`}
            >
              {contact.email}
            </a>
            <a
              href={contact.aboutHref}
              className={`inline-flex min-h-12 items-center rounded-xl border border-gray-200 bg-white px-5 text-[15px] font-semibold text-gray-900 shadow-sm transition-[border-color,transform] duration-300 hover:scale-[1.02] hover:border-gray-400 ${focusRing}`}
            >
              {contact.aboutLabel[lang]} →
            </a>
            <a
              href={contact.homeContactHref}
              className={`inline-flex min-h-12 items-center rounded-xl px-3 text-[15px] font-semibold text-gray-600 hover:text-gray-900 ${focusRing}`}
            >
              {contact.homeLabel[lang]}
            </a>
          </div>
        </div>
        <ul className="space-y-3 self-end">
          {summary.bullets.map((b, i) => (
            <li key={i} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <span className="font-mono text-sm font-bold text-[#0070f3]" aria-hidden>
                0{i + 1}
              </span>
              <span className="text-[15px] leading-relaxed text-gray-700">{b[lang]}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Every section ─────────────────────────────────────────────────── */}
      <div className="mt-20 flex flex-wrap items-end justify-between gap-4 border-t border-gray-200 pt-12 sm:mt-28">
        <div>
          <h2 id="overview-sections" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {f.overviewSections}
          </h2>
          <p className="mt-2 text-gray-600">{f.overviewSectionsIntro}</p>
        </div>
      </div>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-labelledby="overview-sections">
        {SECTIONS.map((sec, i) => {
          const secLinks = links(sec);
          return (
            <li
              key={sec.id}
              id={`overview-${sec.id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="h-1.5" style={{ background: sec.color }} aria-hidden />
              <article className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs font-bold" style={{ color: sec.color }} aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-gray-900">{sec.title[lang]}</h3>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-800">{text(sec.tagline, lang)}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{lead(text(sec.card.body, lang) ?? '')}</p>
                {secLinks.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                    {secLinks.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          {...(isExternal(l.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className={`inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold text-[#0070f3] hover:underline ${focusRing}`}
                        >
                          {l.label[lang]}
                          <span aria-hidden>{isExternal(l.href) ? '↗' : '→'}</span>
                          {isExternal(l.href) && <span className="sr-only"> {f.opensNewTab}</span>}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      {/* ── Rather play? ──────────────────────────────────────────────────── */}
      <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-white p-6 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0070f3]">{f.ratherPlay}</p>
          <p className="mt-2 max-w-2xl text-gray-700">{intro.body[lang]}</p>
        </div>
        <a
          href="#play"
          className={`inline-flex min-h-12 shrink-0 items-center rounded-xl bg-gray-900 px-5 text-[15px] font-semibold text-white transition-transform duration-300 hover:scale-[1.02] ${focusRing}`}
        >
          {f.backToGame} ↑
        </a>
      </div>
    </div>
  );
}

/** Screen-reader / no-JS description of the game (the visible title card lives in the HUD). */
export function IntroText() {
  const { lang } = useLang();
  return (
    <p id="the-game-intro" className="sr-only">
      {intro.body[lang]}
    </p>
  );
}
