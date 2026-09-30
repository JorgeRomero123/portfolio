'use client';

// Tiny toolkit for the landmark models: shared flat-shaded materials (cached per colour/options),
// a `Kit` that collects transformed primitives per material and merges them into one geometry per
// material (so a whole static model costs a handful of draw calls), and once-only canvas textures.
//
// Everything is built once per page (module-level caches) and lives for the page's lifetime.
import {
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type MeshStandardMaterialParameters,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type V3 = readonly [number, number, number];

// ------------------------------------------------------------------ materials
const MATS = new Map<string, MeshStandardMaterial>();

/** Shared flat-shaded standard material, cached by colour + options. */
export function mat(color: string, opts: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
  const key = color + JSON.stringify(opts, (k, v) => (v && typeof v === 'object' && 'isTexture' in v ? v.uuid : v));
  let m = MATS.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, flatShading: true, roughness: 0.78, metalness: 0, ...opts });
    MATS.set(key, m);
  }
  return m;
}

/** Emissive "screen/light" material. */
export const glow = (color: string, intensity = 0.9) => mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.5 });

// ------------------------------------------------------------------ primitives
export const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
export const cyl = (rt: number, rb: number, h: number, seg = 8) => new CylinderGeometry(rt, rb, h, seg);
export const cone = (r: number, h: number, seg = 8) => new ConeGeometry(r, h, seg);
export const ball = (r: number, detail = 0) => new IcosahedronGeometry(r, detail);
export const sphere = (r: number, w = 10, h = 7) => new SphereGeometry(r, w, h);
export const torus = (r: number, t: number, rs = 4, ts = 16) => new TorusGeometry(r, t, rs, ts);

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _p = new Vector3();
const _s = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Transform a (fresh) geometry in place: scale, then rotate (XYZ euler), then translate. */
export function at(g: BufferGeometry, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]): BufferGeometry {
  _m.compose(_p.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(s[0], s[1], s[2]));
  return g.applyMatrix4(_m);
}

/** A cylinder (or box, via `shape`) running from point a to point b. */
export function strut(a: V3, b: V3, r: number, shape: 'cyl' | 'box' = 'cyl', seg = 5): BufferGeometry {
  _a.set(a[0], a[1], a[2]);
  _b.set(b[0], b[1], b[2]);
  const len = _a.distanceTo(_b);
  const g = shape === 'cyl' ? new CylinderGeometry(r, r, len, seg) : new BoxGeometry(r * 2, len, r * 2);
  _q.setFromUnitVectors(UP, _b.clone().sub(_a).normalize());
  _m.compose(_p.addVectors(_a, _b).multiplyScalar(0.5), _q, _s.set(1, 1, 1));
  return g.applyMatrix4(_m);
}

// ------------------------------------------------------------------ baking
export interface BakedPart {
  geometry: BufferGeometry;
  material: Material;
}

function normalise(g: BufferGeometry): BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  if (n !== g) g.dispose();
  for (const name of Object.keys(n.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') n.deleteAttribute(name);
  return n;
}

/** Collects primitives per material; `bake()` merges each material's pieces into one geometry. */
export class Kit {
  private groups = new Map<Material, BufferGeometry[]>();
  add(material: Material, g: BufferGeometry, p?: V3, r?: V3, s?: V3): this {
    const list = this.groups.get(material) ?? [];
    list.push(p || r || s ? at(g, p, r, s) : g);
    this.groups.set(material, list);
    return this;
  }
  bake(): BakedPart[] {
    const out: BakedPart[] = [];
    this.groups.forEach((list, material) => {
      const parts = list.map(normalise);
      const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
      if (parts.length > 1) parts.forEach((q) => q.dispose());
      out.push({ geometry, material });
    });
    return out;
  }
}

/** Renders baked parts (shadows on). */
export function Baked({ parts, castShadow = true }: { parts: readonly BakedPart[]; castShadow?: boolean }) {
  return (
    <>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={p.material} castShadow={castShadow} receiveShadow />
      ))}
    </>
  );
}

const ONCE = new Map<string, unknown>();
/** Module-level memo: builds a value once per key for the page's lifetime. */
export function once<T>(key: string, build: () => T): T {
  if (!ONCE.has(key)) ONCE.set(key, build());
  return ONCE.get(key) as T;
}

/** A canvas texture drawn once (sRGB). */
export function canvasTexture(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  return once(`tex:${key}`, () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  });
}

/** Cream plinth with a thin accent band, shared by most landmarks. Top surface at y = PLINTH. */
export const PLINTH = 0.045;
export function addPlinth(kit: Kit, color: string, r = 0.47) {
  kit.add(mat('#f6efe2'), cyl(r - 0.01, r, PLINTH, 10), [0, PLINTH / 2, 0]);
  kit.add(mat(color, { roughness: 0.6 }), cyl(r + 0.012, r + 0.018, 0.016, 10), [0, 0.008, 0]);
}
