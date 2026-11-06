import type { Metadata } from 'next';
import { Familjen_Grotesk, Newsreader } from 'next/font/google';
import Ruleta from '@/components/cumple-abi/Ruleta';

const display = Familjen_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-abi-display' });
const body = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-abi-body' });

export const metadata: Metadata = {
  title: '¡Cumple de Abi! 🎂',
  description: 'Gira la ruleta y dibuja lo que te toque en el lienzo.',
  robots: { index: false, follow: false },
};

const CONFETTI = [
  { top: '6%', left: '8%', color: '#D98580', rot: 20 },
  { top: '12%', left: '86%', color: '#6C7DE0', rot: -15 },
  { top: '30%', left: '4%', color: '#E5A23C', rot: 40 },
  { top: '44%', left: '93%', color: '#3F8F45', rot: 10 },
  { top: '64%', left: '6%', color: '#B8B6EA', rot: -30 },
  { top: '78%', left: '90%', color: '#D98580', rot: 25 },
  { top: '90%', left: '14%', color: '#6C7DE0', rot: -10 },
];

export default function CumpleAbiPage() {
  return (
    // Capa a pantalla completa: tapa la navegación del portafolio para que la página
    // sea 100% de la fiesta.
    <div
      className={`${display.variable} ${body.variable} fixed inset-0 z-[100] overflow-y-auto bg-[#F4EDE1] text-[#1B1B1B]`}
      style={{
        fontFamily: 'var(--font-abi-body), serif',
        backgroundImage: 'radial-gradient(rgba(27,27,27,0.09) 1px, transparent 1.2px)',
        backgroundSize: '14px 14px',
      }}
    >
      <style>{`
        @keyframes abi-pop { 0% { transform: scale(.85) rotate(-4deg); opacity: 0 } 60% { transform: scale(1.04) rotate(-1deg); opacity: 1 } 100% { transform: scale(1) rotate(-1deg) } }
        .abi-pop { animation: abi-pop .45s ease-out both }
        @keyframes abi-wobble { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } }
        .abi-wobble { animation: abi-wobble 2.4s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .abi-pop, .abi-wobble { animation: none } }
      `}</style>

      {/* Bandera francesa arriba */}
      <div className="flex h-3 w-full" aria-hidden>
        <div className="flex-1 bg-[#6C7DE0]" />
        <div className="flex-1 bg-[#F4EDE1]" />
        <div className="flex-1 bg-[#D98580]" />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="absolute block h-4 w-2.5 rounded-sm border-2 border-[#1B1B1B]"
            style={{ top: c.top, left: c.left, background: c.color, transform: `rotate(${c.rot}deg)` }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center px-4 pb-16 pt-10 text-center">
        <span
          className="abi-wobble inline-block rounded-md border-[3px] border-[#1B1B1B] bg-[#B8B6EA] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0_#1B1B1B]"
        >
          Joyeux anniversaire
        </span>

        <h1
          className="mt-5 text-6xl font-bold leading-[0.95] sm:text-7xl"
          style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}
        >
          ¡Feliz cumple,{' '}
          <span className="relative inline-block">
            <span className="relative z-10">Abi!</span>
            <span aria-hidden className="absolute inset-x-[-6px] bottom-1 z-0 h-4 -rotate-2 bg-[#F0C49B]" />
          </span>
        </h1>

        <p className="mt-5 text-xl italic leading-snug">
          Gira la ruleta, mira qué te tocó y dibújalo en el lienzo para Abi.
        </p>

        <div className="mt-10 w-full">
          <Ruleta />
        </div>

        <ol className="mt-4 w-full space-y-3 text-left text-lg">
          {['Gira la ruleta.', 'Ve al lienzo con lo que te tocó.', 'Dibújalo con mucho amor (o mucho caos).'].map(
            (step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-[#1B1B1B] bg-[#E5A23C] font-bold"
                  style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ),
          )}
        </ol>

        <p className="mt-12 font-mono text-xs uppercase tracking-widest text-[#1B1B1B]/60">
          Hecho con 💗 para Abi
        </p>
      </div>
    </div>
  );
}
