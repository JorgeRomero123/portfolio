'use client';

// myalbumlink.com: an open album floating over a pedestal, with a photo card, a video card (play
// triangle), a tiny 360 sphere and a PDF page slowly orbiting it. Cards always face the viewer.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, canvasTexture, cyl, mat, once } from './kit';

const ALBUM_Y = 0.5;
const ORBIT_R = 0.38;
const ORBIT_Y = 0.35;

function photo(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(1, '#e0f2fe');
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  g.fillStyle = '#fde047';
  g.beginPath();
  g.arc(x + w * 0.75, y + h * 0.3, h * 0.12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0d9488';
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x + w * 0.35, y + h * 0.45);
  g.lineTo(x + w * 0.6, y + h * 0.75);
  g.lineTo(x + w * 0.78, y + h * 0.55);
  g.lineTo(x + w, y + h);
  g.fill();
}

const TEX = {
  pages: () =>
    canvasTexture('album-page', 128, 160, (g, w, h) => {
      g.fillStyle = '#fffdf8';
      g.fillRect(0, 0, w, h);
      photo(g, 12, 12, w - 24, 70);
      photo(g, 12, 92, 50, 56);
      g.fillStyle = '#0d9488';
      g.fillRect(70, 96, 46, 7);
      g.fillStyle = '#d6d3d1';
      for (let i = 0; i < 4; i++) g.fillRect(70, 110 + i * 9, 46 - i * 8, 4);
    }),
  photo: () =>
    canvasTexture('album-photo', 128, 104, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      photo(g, 8, 8, w - 16, h - 28);
    }),
  video: () =>
    canvasTexture('album-video', 128, 88, (g, w, h) => {
      g.fillStyle = '#1f2937';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(w / 2, h / 2, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#0d9488';
      g.beginPath();
      g.moveTo(w / 2 - 8, h / 2 - 13);
      g.lineTo(w / 2 + 14, h / 2);
      g.lineTo(w / 2 - 8, h / 2 + 13);
      g.fill();
      g.fillStyle = '#ef4444';
      g.fillRect(8, h - 10, w * 0.45, 4);
    }),
  pdf: () =>
    canvasTexture('album-pdf', 96, 128, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#dc2626';
      g.fillRect(0, 0, w, 30);
      g.fillStyle = '#ffffff';
      g.font = 'bold 22px system-ui, Arial, sans-serif';
      g.textAlign = 'center';
      g.fillText('PDF', w / 2, 23);
      g.fillStyle = '#9ca3af';
      for (let i = 0; i < 8; i++) g.fillRect(10, 42 + i * 10, w - 20 - (i % 3) * 14, 5);
    }),
  sphere: () =>
    canvasTexture('album-sphere', 128, 64, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(0.55, '#e0f2fe');
      sky.addColorStop(0.56, '#5eead4');
      sky.addColorStop(1, '#0f766e');
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h);
    }),
};

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  k.add(mat('#f6efe2'), cyl(0.13, 0.17, 0.2, 8), [0, PLINTH + 0.1, 0]);
  k.add(mat(color, { roughness: 0.6 }), cyl(0.135, 0.135, 0.03, 8), [0, PLINTH + 0.19, 0]);
  return k.bake();
}

function buildAlbum(color: string) {
  // Open book: two covers in a shallow V along a spine on local z; pages on top get the texture.
  const k = new Kit();
  const cover = mat(color, { roughness: 0.55 });
  k.add(cover, box(0.29, 0.024, 0.38), [-0.142, 0, 0], [0, 0, -0.16]);
  k.add(cover, box(0.29, 0.024, 0.38), [0.142, 0, 0], [0, 0, 0.16]);
  k.add(cover, cyl(0.022, 0.022, 0.38, 6), [0, -0.018, 0], [Math.PI / 2, 0, 0]);
  return k.bake();
}

export default function MyAlbumLink({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`album:${color}`, () => build(color));
  const album = once(`album:book:${color}`, () => buildAlbum(color));
  const m = once('album:mats', () => ({
    pages: mat('#ffffff', { map: TEX.pages(), roughness: 0.85, flatShading: false }),
    photo: mat('#ffffff', { map: TEX.photo(), roughness: 0.8, flatShading: false }),
    video: mat('#ffffff', { map: TEX.video(), roughness: 0.8, flatShading: false }),
    pdf: mat('#ffffff', { map: TEX.pdf(), roughness: 0.8, flatShading: false }),
    sphere: mat('#ffffff', { map: TEX.sphere(), roughness: 0.6, flatShading: false }),
    ring: mat(color, { transparent: true, opacity: 0.45, roughness: 0.6 }),
  }));
  const book = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const items = useRef<(Group | null)[]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!reducedMotion) t.current += Math.min(dt, 0.05);
    const tt = t.current;
    if (book.current) book.current.position.y = ALBUM_Y + Math.sin(tt * 1.3) * 0.025;
    const o = orbit.current;
    if (!o) return;
    o.rotation.y = tt * 0.35;
    items.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.y = -o.rotation.y; // keep facing the viewer
      g.position.y = Math.sin(tt * 1.6 + i * 1.7) * 0.03;
    });
  });
  const place = (i: number): [number, number, number] => {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    return [Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R];
  };
  return (
    <group>
      <Baked parts={parts} />
      <group ref={book} position={[0, ALBUM_Y, 0]} rotation-x={0.6}>
        <Baked parts={album} />
        <mesh position={[-0.142, 0.016, 0]} rotation-z={-0.16} material={m.pages}>
          <boxGeometry args={[0.27, 0.012, 0.36]} />
        </mesh>
        <mesh position={[0.142, 0.016, 0]} rotation-z={0.16} material={m.pages}>
          <boxGeometry args={[0.27, 0.012, 0.36]} />
        </mesh>
      </group>
      <mesh position={[0, ORBIT_Y, 0]} rotation-x={Math.PI / 2} material={m.ring}>
        <torusGeometry args={[ORBIT_R, 0.008, 3, 48]} />
      </mesh>
      <group ref={orbit} position={[0, ORBIT_Y, 0]}>
        {[
          <mesh key="p" material={m.photo} castShadow>
            <boxGeometry args={[0.18, 0.15, 0.014]} />
          </mesh>,
          <mesh key="v" material={m.video} castShadow>
            <boxGeometry args={[0.19, 0.13, 0.014]} />
          </mesh>,
          <mesh key="s" material={m.sphere} castShadow>
            <sphereGeometry args={[0.075, 16, 10]} />
          </mesh>,
          <mesh key="d" material={m.pdf} castShadow>
            <boxGeometry args={[0.13, 0.17, 0.012]} />
          </mesh>,
        ].map((el, i) => (
          <group key={i} position={place(i)}>
            <group
              ref={(g) => {
                items.current[i] = g;
              }}
            >
              {el}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
