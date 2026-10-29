import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Familjen_Grotesk, Newsreader } from 'next/font/google';
import Tree, { TallTree } from '@/components/illustration/Tree';
import Jorge, {
  JorgeAtLaptop, JorgeWithCamera, JorgeFlyingDrone, JorgePlayingCards,
} from '@/components/illustration/Jorge';
import {
  Drone, BoardGame, Camera360, CoysPennant, SoccerBall, Pencil, Canvas, Drawing, Glasses, Laptop, Coffee,
  Camera, Projector, PictureFrames, PottedPlant, DeskLamp, Mailbox, Birds,
} from '@/components/illustration/objects';
import { ElevatorCar, ElevatorShaft, FloorDial, ButtonPanel, Ding } from '@/components/illustration/elevator';

/**
 * Asset sheet for the illustration pieces, each shown on its own so it can be judged
 * before anything is assembled. Temporary — delete once the homepage uses them.
 */

export const metadata: Metadata = {
  title: 'Illustration assets',
  robots: { index: false, follow: false },
};

const familjen = Familjen_Grotesk({ subsets: ['latin'] });
const newsreader = Newsreader({ subsets: ['latin'], axes: ['opsz'] });

const FLOORS = [
  { key: 'R', label: 'hello' }, { key: '4', label: 'work' }, { key: '3', label: 'tools' },
  { key: '2', label: 'gallery' }, { key: '1', label: 'contact' },
];

const full = { width: '100%', height: 'auto' } as const;

const ASSETS: { name: string; note: string; render: ReactNode }[] = [
  { name: 'Elevator car · open', note: 'components/illustration/elevator.tsx', render: <ElevatorCar style={full} /> },
  { name: 'Elevator car · closed', note: 'doors="closed" — slides via CSS transition', render: <ElevatorCar doors="closed" style={full} /> },
  {
    name: 'Shaft (tiles vertically)',
    note: 'three storeys stacked',
    render: (
      <div style={{ display: 'flex', flexDirection: 'column', width: '60%', margin: '0 auto' }}>
        {[0, 1, 2].map((i) => <ElevatorShaft key={i} style={{ ...full, display: 'block' }} />)}
      </div>
    ),
  },
  { name: 'Floor dial', note: 'needle on floor 3', render: <FloorDial floors={['1', '2', '3', '4', 'R']} current={2} style={full} /> },
  { name: 'Button panel', note: 'the navigation; "tools" active', render: <ButtonPanel floors={FLOORS} active={2} style={{ width: '70%', height: 'auto', display: 'block', margin: '0 auto' }} /> },
  { name: 'Ding', note: 'arrival burst', render: <Ding style={full} /> },
  {
    name: 'Jorge',
    note: 'components/illustration/Jorge.tsx · waves unless reduced motion',
    render: <Jorge style={{ width: '100%', height: 'auto' }} />,
  },
  ...([
    ['Jorge at the laptop', JorgeAtLaptop], ['Jorge with camera', JorgeWithCamera],
    ['Jorge flying the drone', JorgeFlyingDrone], ['Jorge playing cards', JorgePlayingCards],
  ] as const).map(([name, Pose]) => ({
    name,
    note: 'components/illustration/Jorge.tsx',
    render: <Pose style={{ width: '100%', height: 'auto' }} />,
  })),
  {
    name: 'Tree',
    note: 'components/illustration/Tree.tsx · sways unless reduced motion',
    render: <Tree style={{ width: '100%', height: 'auto' }} />,
  },
  {
    name: 'Tall tree',
    note: 'components/illustration/Tree.tsx',
    render: <TallTree style={{ width: '100%', height: 'auto' }} />,
  },
  ...([
    ['Drone', Drone], ['360° camera', Camera360], ['Board game', BoardGame], ['COYS pennant', CoysPennant],
    ['Football', SoccerBall], ['Pencil', Pencil], ['Canvas', Canvas], ['Drawing', Drawing],
    ['Glasses', Glasses], ['Laptop', Laptop], ['Coffee', Coffee], ['Camera', Camera], ['Projector', Projector],
    ['Picture frames', PictureFrames], ['Potted plant', PottedPlant], ['Desk lamp', DeskLamp], ['Mailbox', Mailbox],
    ['Birds', Birds],
  ] as const).map(([name, Asset]) => ({
    name,
    note: 'components/illustration/objects.tsx',
    render: <Asset style={{ width: '100%', height: 'auto' }} />,
  })),
];

export default function AssetsLab() {
  return (
    <div style={{ background: '#F4EDE1', color: '#1B1B1B', minHeight: '100vh', padding: 'clamp(24px,5vw,64px) 16px', fontFamily: newsreader.style.fontFamily }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: familjen.style.fontFamily, fontWeight: 700, fontSize: 'clamp(36px,5vw,64px)', letterSpacing: '-0.045em', margin: 0 }}>
          Illustration assets
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 24, marginTop: 32 }}>
          {ASSETS.map((a) => (
            <figure key={a.name} style={{ margin: 0, background: '#fffaf2', border: '2.5px solid #1B1B1B', boxShadow: '5px 5px 0 #1B1B1B', borderRadius: 10, padding: 20 }}>
              {a.render}
              <figcaption style={{ marginTop: 12 }}>
                <div style={{ fontFamily: familjen.style.fontFamily, fontWeight: 700, fontSize: 22 }}>{a.name}</div>
                <div style={{ fontSize: 14, opacity: 0.65 }}>{a.note}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
