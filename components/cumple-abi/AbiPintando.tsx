// Abi pintando en su caballete. SVG hecho a mano, animado solo con CSS.
// Para parecerse más a ella, ajusta los colores de LOOK (pelo, piel, ropa).

const INK = '#1B1B1B';

const LOOK = {
  hair: '#3B2416',
  skin: '#E2AE88',
  blush: '#D98580',
  dress: '#D98580',
  beret: '#6C7DE0',
  lips: '#B4433D',
};

export default function AbiPintando({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 210" className={className} role="img" aria-label="Abi pintando en su caballete">
      <style>{`
        .ap-arm { transform-origin: 104px 118px; animation: ap-paint 0.9s ease-in-out infinite alternate; }
        .ap-head { transform-origin: 80px 96px; animation: ap-bob 1.8s ease-in-out infinite; }
        .ap-stroke { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ap-draw 8s linear infinite; }
        .ap-s2 { animation-name: ap-draw2 } .ap-s3 { animation-name: ap-draw3 } .ap-s4 { animation-name: ap-draw4 }
        .ap-spark { transform-box: fill-box; transform-origin: center; animation: ap-twinkle 1.6s ease-in-out infinite; }
        @keyframes ap-paint { from { transform: rotate(-14deg) } to { transform: rotate(10deg) } }
        @keyframes ap-bob { 0%,100% { transform: rotate(-2deg) } 50% { transform: rotate(3deg) translateY(-1px) } }
        @keyframes ap-draw  { 0% { stroke-dashoffset: 1; opacity: 1 } 15%,85% { stroke-dashoffset: 0; opacity: 1 } 95%,100% { stroke-dashoffset: 0; opacity: 0 } }
        @keyframes ap-draw2 { 0%,15% { stroke-dashoffset: 1; opacity: 1 } 30%,85% { stroke-dashoffset: 0; opacity: 1 } 95%,100% { stroke-dashoffset: 0; opacity: 0 } }
        @keyframes ap-draw3 { 0%,30% { stroke-dashoffset: 1; opacity: 1 } 45%,85% { stroke-dashoffset: 0; opacity: 1 } 95%,100% { stroke-dashoffset: 0; opacity: 0 } }
        @keyframes ap-draw4 { 0%,45% { stroke-dashoffset: 1; opacity: 1 } 60%,85% { stroke-dashoffset: 0; opacity: 1 } 95%,100% { stroke-dashoffset: 0; opacity: 0 } }
        @keyframes ap-twinkle { 0%,100% { transform: scale(.6) rotate(0deg); opacity: .5 } 50% { transform: scale(1.1) rotate(20deg); opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .ap-arm, .ap-head, .ap-spark { animation: none }
          .ap-stroke { animation: none; stroke-dashoffset: 0 }
        }
      `}</style>

      {/* Sombra del piso, en medio tono */}
      <ellipse cx="130" cy="198" rx="112" ry="8" fill={INK} opacity="0.12" />

      {/* Caballete */}
      <g stroke={INK} strokeWidth="4" strokeLinecap="round">
        <line x1="190" y1="30" x2="160" y2="196" />
        <line x1="190" y1="30" x2="222" y2="196" />
        <line x1="190" y1="30" x2="194" y2="196" />
        <line x1="166" y1="150" x2="216" y2="150" />
      </g>

      {/* Lienzo */}
      <g transform="rotate(3 190 85)">
        <rect x="144" y="34" width="94" height="104" rx="2" fill="#FFFDF7" stroke={INK} strokeWidth="3" />
        {/* Lo que va apareciendo: un sol, una torre Eiffel, un corazón y pasto */}
        <path className="ap-stroke" pathLength={1} d="M164 62 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0" fill="none" stroke="#E5A23C" strokeWidth="5" strokeLinecap="round" />
        <path className="ap-stroke ap-s2" pathLength={1} d="M203 122 L213 54 L223 122 M206 100 H220 M209 80 H217" fill="none" stroke="#6C7DE0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path className="ap-stroke ap-s3" pathLength={1} d="M176 104 C166 94 168 84 176 88 C184 84 186 94 176 104 Z" fill="none" stroke="#D98580" strokeWidth="4" strokeLinejoin="round" />
        <path className="ap-stroke ap-s4" pathLength={1} d="M150 128 Q160 120 168 128 T186 128 T204 128 T234 128" fill="none" stroke="#3F8F45" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Destellos */}
      <path className="ap-spark" d="M128 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#E5A23C" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path className="ap-spark" style={{ animationDelay: '0.8s' }} d="M246 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#B8B6EA" stroke={INK} strokeWidth="2" strokeLinejoin="round" />

      {/* Abi */}
      <g>
        {/* Pelo largo de atrás */}
        <g className="ap-head">
          <path d="M56 92 C50 120 54 140 62 150 L100 150 C106 132 106 112 102 92 Z" fill={LOOK.hair} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </g>

        {/* Piernas */}
        <g stroke={INK} strokeWidth="4" strokeLinecap="round">
          <line x1="72" y1="178" x2="70" y2="196" />
          <line x1="90" y1="178" x2="92" y2="196" />
        </g>
        <ellipse cx="66" cy="197" rx="8" ry="4" fill={INK} />
        <ellipse cx="96" cy="197" rx="8" ry="4" fill={INK} />

        {/* Vestido */}
        <path d="M66 114 L98 114 L112 182 L50 182 Z" fill={LOOK.dress} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        {/* Lunares */}
        <g fill="#FFFDF7">
          <circle cx="72" cy="140" r="2.5" />
          <circle cx="90" cy="132" r="2.5" />
          <circle cx="64" cy="166" r="2.5" />
          <circle cx="84" cy="158" r="2.5" />
          <circle cx="100" cy="170" r="2.5" />
        </g>

        {/* Brazo de la paleta */}
        <path d="M68 120 Q54 136 50 150" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
        <path d="M68 120 Q54 136 50 150" fill="none" stroke={LOOK.skin} strokeWidth="4" strokeLinecap="round" />
        <g transform="rotate(-18 40 156)">
          <path d="M22 156 C22 142 54 140 58 152 C60 160 50 158 48 164 C44 172 22 170 22 156 Z" fill="#E8C9A0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="32" cy="152" r="3.5" fill="#D98580" />
          <circle cx="42" cy="149" r="3.5" fill="#6C7DE0" />
          <circle cx="51" cy="152" r="3.5" fill="#E5A23C" />
          <circle cx="31" cy="162" r="3.5" fill="#3F8F45" />
        </g>

        {/* Brazo del pincel (se mueve) */}
        <g className="ap-arm">
          <path d="M98 118 Q118 112 132 100" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path d="M98 118 Q118 112 132 100" fill="none" stroke={LOOK.skin} strokeWidth="4" strokeLinecap="round" />
          <line x1="130" y1="102" x2="152" y2="80" stroke="#8A5A2B" strokeWidth="4" strokeLinecap="round" />
          <line x1="130" y1="102" x2="152" y2="80" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M150 82 L158 72 L156 84 Z" fill="#D98580" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>

        {/* Cabeza */}
        <g className="ap-head">
          <rect x="76" y="104" width="8" height="12" fill={LOOK.skin} stroke={INK} strokeWidth="3" />
          <circle cx="80" cy="90" r="19" fill={LOOK.skin} stroke={INK} strokeWidth="3" />
          {/* Flequillo */}
          <path d="M60 88 C60 70 76 64 88 68 C96 70 101 78 100 88 C94 82 90 80 84 82 C80 78 74 80 70 84 C66 82 62 84 60 88 Z" fill={LOOK.hair} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {/* Boina */}
          <path d="M60 74 C62 60 92 56 104 68 C98 72 76 74 60 74 Z" fill={LOOK.beret} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <line x1="84" y1="60" x2="86" y2="54" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          {/* Cara (mira al lienzo) */}
          <circle cx="90" cy="92" r="2.4" fill={INK} />
          <path d="M84 88 Q88 85 92 87" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="92" cy="99" r="3.5" fill={LOOK.blush} opacity="0.7" />
          <path d="M88 102 Q92 105 96 101" fill="none" stroke={LOOK.lips} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
