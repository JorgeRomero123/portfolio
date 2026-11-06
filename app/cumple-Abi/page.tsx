import type { Metadata } from 'next';
import { Familjen_Grotesk, Newsreader } from 'next/font/google';
import Ruleta from '@/components/cumple-abi/Ruleta';
import AbiPintando from '@/components/cumple-abi/AbiPintando';

const display = Familjen_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-abi-display' });
const body = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-abi-body' });

export const metadata: Metadata = {
  title: '¡Cumple de Abi! 🎂',
  description: 'Gira la ruleta y dibuja lo que te toque en el lienzo.',
  robots: { index: false, follow: false },
};

// Confeti que cae sin parar. Valores fijos (no Math.random) para que el HTML salga igual siempre.
const COLORS = ['#D98580', '#6C7DE0', '#E5A23C', '#3F8F45', '#B8B6EA', '#F0C49B'];
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const r = (k: number) => ((Math.sin((i + 1) * 12.9898 * k) * 43758.5453) % 1 + 1) % 1;
  return {
    left: `${Math.round(r(1) * 96 + 2)}%`,
    color: COLORS[i % COLORS.length],
    round: i % 4 === 0,
    size: 8 + Math.round(r(2) * 6),
    fall: (7 + r(3) * 7).toFixed(2),
    delay: (-r(4) * 14).toFixed(2),
    sway: (1.6 + r(5) * 1.6).toFixed(2),
    // Con movimiento reducido, cada pieza se queda quieta a esta altura (en vh).
    rest: Math.round(r(6) * 95),
  };
});

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
        @keyframes abi-fall { from { transform: translateY(-5vh) } to { transform: translateY(110vh) } }
        .abi-fall { animation: abi-fall linear infinite }
        @keyframes abi-sway { 0% { transform: translateX(-10px) rotate(-35deg) } 100% { transform: translateX(10px) rotate(35deg) } }
        .abi-sway { animation: abi-sway ease-in-out infinite alternate }
        @media (prefers-reduced-motion: reduce) {
          .abi-pop, .abi-wobble, .abi-sway { animation: none }
          .abi-fall { animation: none; transform: translateY(calc(var(--i, 0) * 1vh)) }
        }
      `}</style>

      {/* Bandera francesa arriba */}
      <div className="flex h-3 w-full" aria-hidden>
        <div className="flex-1 bg-[#6C7DE0]" />
        <div className="flex-1 bg-[#F4EDE1]" />
        <div className="flex-1 bg-[#D98580]" />
      </div>

      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="abi-fall absolute -top-6 block"
            style={
              {
                left: c.left,
                animationDuration: `${c.fall}s`,
                animationDelay: `${c.delay}s`,
                '--i': c.rest,
              } as React.CSSProperties
            }
          >
            <span
              className={`abi-sway block border-2 border-[#1B1B1B] ${c.round ? 'rounded-full' : 'rounded-sm'}`}
              style={{
                width: c.round ? c.size : c.size * 0.6,
                height: c.size,
                background: c.color,
                animationDuration: `${c.sway}s`,
              }}
            />
          </span>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-full max-w-md flex-col items-center px-4 pb-16 pt-10 text-center">
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

        <AbiPintando className="mt-6 h-auto w-full max-w-[300px]" />

        <div className="mt-8 w-full">
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
