import { useId, type CSSProperties } from 'react';
import { C, InkLine, InkSvg, type InkIds } from './ink';

/**
 * Jorge as a character: swept dark hair, big grin, stubble, sage tee. Every pose shares
 * the same head, tee and legs, so a change to his face lands in all of them.
 */

const SKIN = '#E2A57F';
const HAIR = '#2A211C';
const SAGE = '#8FA882';
const SAGE_DARK = '#6F8865';
const DENIM = '#5568A8';

const FACE = 'M 120 46 C 146 46, 162 64, 162 94 C 162 122, 146 140, 120 140 C 94 140, 78 122, 78 94 C 78 64, 94 46, 120 46 Z';

type Props = { className?: string; style?: CSSProperties };

const useUid = () => useId().replace(/[^a-zA-Z0-9_-]/g, '');

/* ------------------------------------------------------------- shared parts */

function Head({
  ids,
  uid,
  gaze = [0, 0],
  mouth = 'grin',
  wink = false,
}: {
  ids: InkIds;
  uid: string;
  /** Pupil offset, for looking at whatever the pose is about. */
  gaze?: [number, number];
  mouth?: 'grin' | 'smile';
  /** Closes his left eye (viewer's right), e.g. when sighting through a camera. */
  wink?: boolean;
}) {
  const clip = `face-${uid}`;
  const [gx, gy] = gaze;
  return (
    <>
      <defs>
        <clipPath id={clip}><path d={FACE} /></clipPath>
      </defs>
      <ellipse cx={79} cy={98} rx={8} ry={11} fill={SKIN} />
      <ellipse cx={161} cy={98} rx={8} ry={11} fill={SKIN} />
      <path d={FACE} fill={SKIN} />
      <g clipPath={`url(#${clip})`} stroke="none">
        <path d={FACE} fill={`url(#${ids.dots})`} opacity={0.28} />
        <path d={FACE} fill={SKIN} transform="translate(-9 -5)" />
        {/* stubble along the jaw */}
        <path d="M 78 112 C 92 150, 148 150, 162 112 L 162 150 L 78 150 Z" fill={`url(#${ids.dots})`} opacity={0.32} />
      </g>
      <path d={FACE} fill="none" />

      {/* hair: swept over, volume on top, a few strays */}
      <path
        d="M 79 98 C 72 70, 84 44, 112 40 C 132 34, 158 44, 163 68 C 166 80, 164 90, 160 98 C 157 86, 152 76, 144 70 C 130 78, 108 76, 96 70 C 90 80, 84 88, 79 98 Z"
        fill={HAIR}
      />
      <path d="M 116 40 q 8 -12 20 -8 M 132 38 q 10 -6 16 2 M 104 44 q -4 -8 2 -14" fill="none" strokeWidth={2.2} />

      <path d="M 98 84 q 8 -5 16 -1 M 128 83 q 8 -4 16 1" fill="none" strokeWidth={3.5} />
      <ellipse cx={106 + gx} cy={95 + gy} rx={3.2} ry={3.8} fill={HAIR} stroke="none" />
      {wink
        ? <path d="M 130 97 q 6 -5 12 0" fill="none" strokeWidth={2.6} />
        : <ellipse cx={136 + gx} cy={95 + gy} rx={3.2} ry={3.8} fill={HAIR} stroke="none" />}
      <path d="M 96 98 q -3 2 -3 5 M 146 98 q 3 2 3 5" fill="none" strokeWidth={1.8} />
      <path d="M 121 98 q -5 12 -1 16 q 4 2 7 -1" fill="none" strokeWidth={2.4} />
      <circle cx={95} cy={114} r={7} fill={C.pink} stroke="none" opacity={0.5} />
      <circle cx={147} cy={114} r={7} fill={C.pink} stroke="none" opacity={0.5} />
      {mouth === 'grin'
        ? <path d="M 101 120 Q 121 142 141 120 Z" fill={C.cream} strokeWidth={2.6} />
        : <path d="M 106 123 Q 121 135 136 123" fill="none" strokeWidth={2.8} />}
    </>
  );
}

/** Neck, the tee (whose outline differs per pose, sleeves included) and the V-neck. */
function Tee({ d, ids, uid }: { d: string; ids: InkIds; uid: string }) {
  const clip = `tee-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={clip}><path d={d} /></clipPath>
      </defs>
      <rect x={108} y={130} width={24} height={30} fill={SKIN} />
      <path d={d} fill={SAGE} />
      <g clipPath={`url(#${clip})`} stroke="none">
        <path d={d} fill={`url(#${ids.dots})`} opacity={0.3} />
        <path d={d} fill={SAGE} transform="translate(-16 -8)" />
      </g>
      <path d={d} fill="none" />
      <path d="M 104 156 L 120 182 L 136 156" fill={SKIN} />
      <path d="M 100 156 L 120 188 L 140 156" fill="none" stroke={SAGE_DARK} strokeWidth={3} />
    </>
  );
}

function StandingLegs({ ids }: { ids: InkIds }) {
  return (
    <>
      <ellipse cx={120} cy={366} rx={70} ry={9} fill={C.lavender} />
      <polygon points="72,256 118,256 114,352 86,352" fill={DENIM} />
      <polygon points="122,256 168,256 156,352 128,352" fill={DENIM} />
      <polygon points="140,256 168,256 156,352 140,352" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
      <path d="M 80 348 L 116 348 Q 120 364 104 364 L 74 364 Q 70 354 80 348 Z" fill={C.mustard} />
      <path d="M 124 348 L 160 348 Q 170 354 166 364 L 136 364 Q 120 364 124 348 Z" fill={C.mustard} />
      <path d="M 74 360 L 112 360 M 128 360 L 166 360" stroke={C.cream} strokeWidth={2.5} />
    </>
  );
}

/** Lower legs and sneakers for the seated poses; the desk or table hides the thighs. */
function SeatedLegs({ ids, top, floor }: { ids: InkIds; top: number; floor: number }) {
  const ankle = floor - 10;
  return (
    <>
      <polygon points={`88,${top} 110,${top} 108,${ankle} 90,${ankle}`} fill={DENIM} />
      <polygon points={`130,${top} 152,${top} 150,${ankle} 132,${ankle}`} fill={DENIM} />
      <polygon points={`140,${top} 152,${top} 150,${ankle} 140,${ankle}`} fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
      <path d={`M 86 ${ankle - 2} L 112 ${ankle - 2} Q 114 ${floor} 102 ${floor} L 82 ${floor} Q 78 ${floor - 6} 86 ${ankle - 2} Z`} fill={C.mustard} />
      <path d={`M 128 ${ankle - 2} L 154 ${ankle - 2} Q 162 ${floor - 6} 158 ${floor} L 138 ${floor} Q 126 ${floor} 128 ${ankle - 2} Z`} fill={C.mustard} />
    </>
  );
}

const Hand = ({ x, y, r = 9 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} fill={SKIN} />;

/* --------------------------------------------------------------- waving */

/** Tee with both sleeves in one outline; the right sleeve is cut for the raised arm. */
const TEE_WAVE = 'M 100 156 Q 86 160 76 166 L 56 202 L 82 211 L 86 194 L 68 266 L 172 266 L 156 196 L 188 188 L 176 160 Q 160 156 140 156 Z';

const FINGERS = ['M 189 98 L 186 81', 'M 195 95 L 194 76', 'M 201 95 L 202 77', 'M 207 98 L 210 83', 'M 188 108 L 180 99'];

/**
 * The waving figure as bare SVG, in the 240×380 frame, for drawing him inside another
 * asset (the elevator car) under that asset's own ink filter.
 */
export function WavingFigure({ ids, wave = true }: { ids: InkIds; wave?: boolean }) {
  const uid = useUid();
  return (
    <>
      <style>{`
        .jorge-wave { transform-origin: 160px 178px; animation: jorge-wave 1.6s ease-in-out infinite; }
        @keyframes jorge-wave { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-9deg); } }
        @media (prefers-reduced-motion: reduce) { .jorge-wave { animation: none; } }
      `}</style>
      <StandingLegs ids={ids} />
      <InkLine d="M 82 178 C 68 202, 64 230, 66 256" width={16} color={SKIN} />
      <Hand x={66} y={262} r={10} />
      {/* waving arm, behind the sleeve; open hand with spread fingers */}
      <g className={wave ? 'jorge-wave' : undefined}>
        <InkLine d="M 162 184 C 180 170, 192 142, 195 114" width={16} color={SKIN} />
        {FINGERS.map((d) => <path key={d} d={d} fill="none" strokeWidth={12} />)}
        <ellipse cx={198} cy={105} rx={12} ry={11} fill={SKIN} />
        {FINGERS.map((d) => <path key={`s${d}`} d={d} fill="none" stroke={SKIN} strokeWidth={6} />)}
        <path d="M 218 84 q 8 8 6 20 M 226 78 q 10 12 7 28" fill="none" strokeWidth={2.4} />
      </g>
      <Tee d={TEE_WAVE} ids={ids} uid={uid} />
      <Head ids={ids} uid={uid} />
    </>
  );
}

/** Standing and waving; the arm waves on a loop unless reduced motion is set. */
export default function Jorge({ wave = true, ...p }: Props & { wave?: boolean }) {
  return (
    <InkSvg viewBox="0 0 240 380" label="Jorge, waving" {...p}>
      {(ids) => <WavingFigure ids={ids} wave={wave} />}
    </InkSvg>
  );
}

/* ------------------------------------------------------------ at laptop */

const TEE_SEATED = 'M 100 156 Q 86 160 74 166 L 52 200 L 74 210 L 76 232 L 164 232 L 166 210 L 188 200 L 166 166 Q 154 156 140 156 Z';

/** Sitting at a desk behind his laptop, coffee on the side — the engineering room. */
export function JorgeAtLaptop(p: Props) {
  const uid = useUid();
  return (
    <InkSvg viewBox="0 0 240 300" label="Jorge working at his laptop" {...p}>
      {(ids) => (
        <>
          <ellipse cx={120} cy={290} rx={100} ry={8} fill={C.lavender} />
          {/* chair: legs, then the back */}
          <path d="M 66 232 L 62 288 M 174 232 L 178 288" fill="none" strokeWidth={5} />
          <rect x={60} y={150} width={120} height={84} rx={14} fill={C.mustard} />
          <SeatedLegs ids={ids} top={226} floor={290} />
          <Tee d={TEE_SEATED} ids={ids} uid={uid} />
          <InkLine d="M 64 204 C 66 222, 78 222, 92 212" width={14} color={SKIN} />
          <InkLine d="M 176 204 C 174 222, 162 222, 148 212" width={14} color={SKIN} />
          <Head ids={ids} uid={uid} gaze={[0, 2]} mouth="smile" />
          {/* desk */}
          <InkLine d="M 28 226 L 24 290 M 212 226 L 216 290" width={6} color={C.bark} />
          <rect x={8} y={212} width={224} height={14} rx={3} fill={C.bark} />
          {/* laptop from behind, with stickers on the lid */}
          <rect x={68} y={148} width={104} height={66} rx={7} fill={C.steel} />
          <rect x={68} y={196} width={104} height={18} rx={4} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          <path d="M 108 172 C 102 164, 112 158, 116 166 C 120 158, 130 164, 124 172 L 116 180 Z" fill={C.pink} strokeWidth={2.2} />
          <circle cx={146} cy={168} r={9} fill={C.cornflower} strokeWidth={2.2} />
          <rect x={84} y={186} width={22} height={12} rx={3} fill={C.mustard} strokeWidth={2.2} transform="rotate(-8 95 192)" />
          {/* coffee */}
          <path d="M 24 190 L 24 208 Q 24 212 28 212 L 44 212 Q 48 212 48 208 L 48 190 Z" fill={C.pink} />
          <path d="M 48 194 q 8 0 8 6 q 0 6 -8 6" fill="none" strokeWidth={3} />
          <path d="M 32 182 q -4 -6 0 -12 M 40 182 q -4 -6 0 -12" fill="none" strokeWidth={2.2} />
        </>
      )}
    </InkSvg>
  );
}

/* ----------------------------------------------------------- with camera */

const TEE_ARMS_UP = 'M 100 156 Q 86 160 76 166 L 52 186 L 66 204 L 84 194 L 68 266 L 172 266 L 156 194 L 174 204 L 188 186 L 164 166 Q 154 156 140 156 Z';

/** Camera up to his eye, the other eye shut — the photography room. */
export function JorgeWithCamera(p: Props) {
  const uid = useUid();
  return (
    <InkSvg viewBox="0 0 240 380" label="Jorge taking a photo" {...p}>
      {(ids) => (
        <>
          <StandingLegs ids={ids} />
          <InkLine d="M 76 184 C 46 180, 46 130, 62 102" width={15} color={SKIN} />
          <InkLine d="M 164 184 C 184 168, 160 122, 130 104" width={15} color={SKIN} />
          <Tee d={TEE_ARMS_UP} ids={ids} uid={uid} />
          <Head ids={ids} uid={uid} wink />
          {/* camera held over his right eye */}
          <path d="M 80 72 L 86 62 L 108 62 L 114 72 Z" fill={C.steel} />
          <rect x={58} y={70} width={72} height={44} rx={7} fill={C.charcoal} />
          <rect x={58} y={70} width={72} height={10} rx={4} fill={C.steel} />
          <circle cx={92} cy={96} r={17} fill={C.charcoal} />
          <circle cx={92} cy={96} r={11} fill={C.lavender} />
          <path d="M 85 92 Q 87 87 92 86" fill="none" stroke={C.cream} strokeWidth={3} />
          <rect x={64} y={64} width={12} height={6} rx={2} fill={C.mustard} strokeWidth={2} />
          <Hand x={60} y={98} r={10} />
          <Hand x={130} y={100} r={10} />
          {/* click */}
          <path d="M 40 62 l -10 -8 M 46 52 l -4 -12 M 56 48 l 2 -12" fill="none" strokeWidth={2.4} />
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------- flying drone */

const TEE_ARMS_IN = 'M 100 156 Q 86 160 76 166 L 58 200 L 82 208 L 86 194 L 68 266 L 172 266 L 154 194 L 158 208 L 182 200 L 164 166 Q 154 156 140 156 Z';

/** Controller in hand, looking up at the drone — the aerial room. */
export function JorgeFlyingDrone(p: Props) {
  const uid = useUid();
  return (
    <InkSvg viewBox="0 -60 260 440" label="Jorge flying a drone" {...p}>
      {(ids) => (
        <>
          <StandingLegs ids={ids} />
          <Tee d={TEE_ARMS_IN} ids={ids} uid={uid} />
          <Head ids={ids} uid={uid} gaze={[3, -3]} />
          {/* controller with antenna and signal */}
          <path d="M 132 198 L 140 168" strokeWidth={3} />
          <path d="M 146 166 q 6 -4 8 -12 M 152 172 q 10 -6 13 -20" fill="none" strokeWidth={2.2} />
          <rect x={94} y={196} width={52} height={26} rx={11} fill={C.charcoal} />
          <circle cx={108} cy={209} r={5} fill={C.steel} strokeWidth={2} />
          <circle cx={132} cy={209} r={5} fill={C.steel} strokeWidth={2} />
          <InkLine d="M 70 204 C 72 222, 86 220, 98 212" width={14} color={SKIN} />
          <InkLine d="M 170 204 C 168 222, 154 220, 142 212" width={14} color={SKIN} />
          <Hand x={98} y={212} r={8} />
          <Hand x={142} y={212} r={8} />
          {/* the drone, overhead */}
          <g transform="translate(150 -40)">
            <path d="M 18 20 L 40 26 M 62 20 L 40 26" fill="none" strokeWidth={5} />
            <ellipse cx={14} cy={14} rx={22} ry={4} fill={C.lavender} strokeWidth={2.4} />
            <ellipse cx={66} cy={14} rx={22} ry={4} fill={C.lavender} strokeWidth={2.4} />
            <path d="M 14 18 L 14 22 M 66 18 L 66 22" strokeWidth={3} />
            <rect x={26} y={20} width={28} height={16} rx={7} fill={C.mustard} />
            <circle cx={40} cy={42} r={6} fill={C.charcoal} />
            <path d="M -6 4 q 20 -6 40 0 M 46 4 q 20 -6 40 0" fill="none" strokeWidth={1.8} />
          </g>
        </>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------- playing cards */

const CARDS: { rot: number; suit: string; color: string }[] = [
  { rot: -18, suit: 'M 0 -4 L 5 3 L 0 10 L -5 3 Z', color: C.pink },
  { rot: 0, suit: 'M 0 8 L -6 1 C -9 -3, -3 -7, 0 -3 C 3 -7, 9 -3, 6 1 Z', color: C.pink },
  { rot: 18, suit: 'M 0 -5 C 5 -1, 7 4, 2 5 L 3 10 L -3 10 L -2 5 C -7 4, -5 -1, 0 -5 Z', color: '#1B1B1B' },
];

/** At a table with a fan of cards, laying one down — the card-games room. */
export function JorgePlayingCards(p: Props) {
  const uid = useUid();
  return (
    <InkSvg viewBox="0 0 260 320" label="Jorge playing cards at a table" {...p}>
      {(ids) => (
        <>
          <ellipse cx={130} cy={308} rx={96} ry={8} fill={C.lavender} />
          <g transform="translate(10 0)">
            <SeatedLegs ids={ids} top={250} floor={306} />
            <Tee d={TEE_SEATED} ids={ids} uid={uid} />
            <InkLine d="M 64 204 C 58 226, 76 238, 96 236" width={14} color={SKIN} />
            <InkLine d="M 176 204 C 190 214, 196 198, 188 182" width={14} color={SKIN} />
            <Head ids={ids} uid={uid} gaze={[3, 1]} />
          </g>
          {/* table */}
          <path d="M 122 250 L 118 304 L 142 304 L 138 250 Z" fill={C.bark} />
          <path d="M 96 304 L 164 304" strokeWidth={6} />
          <ellipse cx={130} cy={242} rx={112} ry={20} fill={C.peach} />
          <path d="M 18 242 Q 130 274 242 242 L 242 248 Q 130 280 18 248 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          {/* card laid on the table */}
          <polygon points="94,236 116,230 124,242 102,248" fill={C.cream} strokeWidth={2.2} />
          <path d="M 108 236 l 3 3 l -3 3 l -3 -3 Z" fill={C.pink} strokeWidth={1.4} />
          <Hand x={106} y={236} r={8} />
          {/* the fan in his other hand */}
          {CARDS.map((card) => (
            <g key={card.rot} transform={`rotate(${card.rot} 198 196)`}>
              <rect x={185} y={146} width={28} height={40} rx={4} fill={C.cream} strokeWidth={2.4} />
              <path d={card.suit} transform="translate(199 164)" fill={card.color} strokeWidth={1.4} />
            </g>
          ))}
          <Hand x={198} y={190} r={9} />
        </>
      )}
    </InkSvg>
  );
}
