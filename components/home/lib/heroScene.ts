import * as THREE from 'three';

/**
 * Hero: a shader-driven particle shell that reacts to the cursor *before* you
 * touch it — the pointer pushes a bulge through the cloud, so the page feels
 * alive on arrival rather than waiting for a drag.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec3  uMouse;
  uniform float uPointer;
  uniform float uBurst;
  uniform float uPixelRatio;

  attribute float aScale;
  attribute vec3  aColor;
  attribute float aSeed;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    // slow breathing so the shell is never perfectly still
    float breathe = sin(uTime * 0.55 + aSeed * 6.283) * 0.045;
    p *= 1.0 + breathe + uBurst * 0.28;

    vec4 world = modelMatrix * vec4(p, 1.0);

    // cursor repulsion, in world space
    float d     = distance(world.xyz, uMouse);
    float force = smoothstep(2.4, 0.0, d) * uPointer;
    vec3  dir   = normalize(world.xyz - uMouse + vec3(0.0001));
    world.xyz  += dir * force * 1.05;

    vec4 mv = viewMatrix * world;
    gl_Position  = projectionMatrix * mv;
    gl_PointSize = aScale * (22.0 / -mv.z) * uPixelRatio * (1.0 + force * 1.8);

    vColor = aColor;
    vAlpha = 0.40 + force * 0.55;
  }
`;

const FRAG = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

export type HeroHandle = {
  /** Pointer position in normalized device coords (-1..1). */
  setPointer: (ndcX: number, ndcY: number, active: boolean) => void;
  /** One-shot expansion pulse — used by the COYS easter egg. */
  burst: () => void;
  resize: () => void;
  dispose: () => void;
};

const PALETTE = [0xff6a3d, 0xffd089, 0x6f7bff] as const;

export function createHeroScene(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean },
): HeroHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
  cam.position.z = 4.6;

  const N = 11000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const scl = new Float32Array(N);
  const sed = new Float32Array(N);

  const writePalette = () => {
    const [c1, c2, c3] = PALETTE.map((h) => new THREE.Color(h));
    for (let i = 0; i < N; i++) {
      const t = sed[i];
      const mix = t < 0.72 ? c1.clone().lerp(c2, t / 0.72) : c1.clone().lerp(c3, (t - 0.72) / 0.28);
      col[i * 3] = mix.r; col[i * 3 + 1] = mix.g; col[i * 3 + 2] = mix.b;
    }
  };

  for (let i = 0; i < N; i++) {
    const r = 1.75 + (Math.random() - 0.5) * 0.5;
    const th = Math.acos(2 * Math.random() - 1);
    const ph = Math.random() * Math.PI * 2;
    pos[i * 3]     = r * Math.sin(th) * Math.cos(ph);
    pos[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph);
    pos[i * 3 + 2] = r * Math.cos(th);
    scl[i] = 0.75 + Math.random() * 1.35;
    sed[i] = Math.random();
  }
  writePalette();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(sed, 1));

  const uniforms = {
    uTime:    { value: 0 },
    uMouse:   { value: new THREE.Vector3(999, 999, 999) },
    uPointer: { value: 0 },
    uBurst:   { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pts = new THREE.Points(geo, mat);
  const group = new THREE.Group();
  group.add(pts);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6a3d, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.005, 8, 200), ringMat);
  ring.rotation.x = Math.PI / 2.3;
  group.add(ring);
  scene.add(group);

  const place = () => {
    const wide = canvas.clientWidth > 760;
    group.position.x = wide ? 2.2 : 0;
    group.position.y = wide ? 0 : 1.35;
  };
  place();

  // ---- pointer state ----
  const ndc = new THREE.Vector2(0, 0);
  const target = new THREE.Vector3(999, 999, 999);
  let pointerStrength = 0;
  let pointerActive = false;

  const setPointer = (x: number, y: number, active: boolean) => {
    ndc.set(x, y);
    pointerActive = active;
  };

  // Project the cursor onto the z = group.position.z plane so repulsion lines
  // up with what the user sees under their cursor.
  const projectPointer = () => {
    const v = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(cam);
    const dir = v.sub(cam.position).normalize();
    const dist = (group.position.z - cam.position.z) / dir.z;
    target.copy(cam.position).add(dir.multiplyScalar(dist));
  };

  // ---- drag (kept from the original, still the primary interaction) ----
  const st = { rx: 0.2, ry: 0.3, tx: 0.2, ty: 0.3, down: false, px: 0, py: 0, vx: 0, vy: 0, idle: 0 };
  const onDown = (e: PointerEvent) => { st.down = true; st.idle = 0; st.px = e.clientX; st.py = e.clientY; };
  const onMove = (e: PointerEvent) => {
    if (!st.down) return;
    const dx = e.clientX - st.px, dy = e.clientY - st.py;
    st.px = e.clientX; st.py = e.clientY;
    st.ty += dx * 0.008; st.tx += dy * 0.008;
    st.vx = dx * 0.008;  st.vy = dy * 0.008;
  };
  const onUp = () => { st.down = false; };

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  let burstV = 0;
  const burst = () => { burstV = 1; };

  let alive = true;
  let raf = 0;
  const clock = new THREE.Clock();

  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);

    uniforms.uTime.value = clock.getElapsedTime();

    projectPointer();
    uniforms.uMouse.value.lerp(target, 0.16);
    const wanted = pointerActive ? 1 : 0;
    pointerStrength += (wanted - pointerStrength) * 0.08;
    uniforms.uPointer.value = pointerStrength;

    burstV *= 0.92;
    uniforms.uBurst.value = burstV;

    if (!st.down) {
      st.ty += st.vx; st.tx += st.vy;
      st.vx *= 0.94;  st.vy *= 0.94;
      st.idle++;
      if (st.idle > 30 && !opts.reducedMotion) st.ty += 0.0032;
    }
    st.rx += (st.tx - st.rx) * 0.08;
    st.ry += (st.ty - st.ry) * 0.08;
    group.rotation.x = st.rx;
    group.rotation.y = st.ry;
    if (!opts.reducedMotion) pts.rotation.y += 0.0011;

    renderer.render(scene, cam);
  };
  loop();

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    place();
  };

  const dispose = () => {
    alive = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    geo.dispose(); mat.dispose(); ring.geometry.dispose(); ringMat.dispose();
    renderer.dispose();
  };

  return { setPointer, burst, resize, dispose };
}
