import * as THREE from 'three';

/**
 * Live demo: a look-around WebGL world. Drag to aim the camera — the same
 * feeling as the 360° tours, but generated rather than captured.
 */
export type WorldHandle = {
  resize: () => void;
  dispose: () => void;
};

export function createWorldScene(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean },
): WorldHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0a09, 0.035);

  const cam = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
  cam.position.set(0, 0, 0);
  cam.rotation.order = 'YXZ';

  // ---- starfield ----
  const SN = 3200;
  const sp = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) {
    const r = 60;
    const th = Math.acos(2 * Math.random() - 1);
    const ph = Math.random() * Math.PI * 2;
    sp[i * 3]     = r * Math.sin(th) * Math.cos(ph);
    sp[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph);
    sp[i * 3 + 2] = r * Math.cos(th);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xfff2e0, size: 0.18, transparent: true, opacity: 0.7 });
  scene.add(new THREE.Points(sg, starMat));

  // ---- floor grid ----
  const grid = new THREE.GridHelper(120, 60, 0xff6a3d, 0x3a2a22);
  grid.position.y = -8;
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.4;
  scene.add(grid);

  // ---- floating solids ----
  const shapes: THREE.Mesh[] = [];
  const materials: Array<THREE.MeshBasicMaterial | THREE.MeshStandardMaterial> = [];
  const COLORS = [0xff6a3d, 0xffd089, 0x6f7bff, 0xff6a3d, 0xe85d75];

  const geoms = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.9, 0.28, 16, 60),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TorusKnotGeometry(0.7, 0.24, 90, 16),
  ];

  for (let i = 0; i < 32; i++) {
    const g = geoms[i % geoms.length];
    const wire = Math.random() > 0.45;
    const c = COLORS[i % COLORS.length];
    const m = wire
      ? new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.6 })
      : new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.2 });
    materials.push(m);

    const mesh = new THREE.Mesh(g, m);
    const ang = Math.random() * Math.PI * 2;
    const rad = 9 + Math.random() * 22;
    mesh.position.set(Math.cos(ang) * rad, (Math.random() - 0.4) * 16, Math.sin(ang) * rad);
    mesh.scale.setScalar(0.6 + Math.random() * 2.2);
    mesh.userData.spin  = (Math.random() - 0.5) * 0.01;
    mesh.userData.spin2 = (Math.random() - 0.5) * 0.01;
    mesh.userData.fy    = mesh.position.y;
    mesh.userData.ph    = Math.random() * Math.PI * 2;
    mesh.userData.slot  = i % COLORS.length;
    shapes.push(mesh);
    scene.add(mesh);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key  = new THREE.PointLight(0xff6a3d, 60, 60); key.position.set(0, 6, 0);   scene.add(key);
  const fill = new THREE.PointLight(0x6f7bff, 40, 60); fill.position.set(10, -4, -8); scene.add(fill);

  // ---- look controls ----
  const look = { yaw: 0.4, pitch: 0, tyaw: 0.4, tpitch: 0, down: false, px: 0, py: 0, idle: 0 };
  const onDown = (e: PointerEvent) => {
    look.down = true; look.idle = 0; canvas.style.cursor = 'grabbing';
    look.px = e.clientX; look.py = e.clientY;
  };
  const onMove = (e: PointerEvent) => {
    if (!look.down) return;
    look.tyaw   -= (e.clientX - look.px) * 0.004;
    look.tpitch -= (e.clientY - look.py) * 0.004;
    look.tpitch = Math.max(-0.9, Math.min(0.9, look.tpitch));
    look.px = e.clientX; look.py = e.clientY;
  };
  const onUp = () => { look.down = false; canvas.style.cursor = 'grab'; };

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  // Only render while the section is actually on screen — this scene is heavy
  // and there is no reason to burn frames behind the fold.
  let visible = false;
  const io = new IntersectionObserver(
    ([en]) => { visible = en.isIntersecting; },
    { threshold: 0.02 },
  );
  io.observe(canvas);

  let alive = true;
  let raf = 0;
  let t = 0;

  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!visible) return;

    t += 0.01;
    if (!look.down && !opts.reducedMotion) {
      look.idle++;
      if (look.idle > 60) look.tyaw += 0.0009;
    }
    look.yaw   += (look.tyaw - look.yaw) * 0.07;
    look.pitch += (look.tpitch - look.pitch) * 0.07;
    cam.rotation.y = look.yaw;
    cam.rotation.x = look.pitch;

    if (!opts.reducedMotion) {
      shapes.forEach((m) => {
        m.rotation.x += m.userData.spin;
        m.rotation.y += m.userData.spin2;
        m.position.y = m.userData.fy + Math.sin(t + m.userData.ph) * 0.6;
      });
    }
    renderer.render(scene, cam);
  };
  loop();

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };

  const dispose = () => {
    alive = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    geoms.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    sg.dispose(); starMat.dispose(); grid.dispose();
    renderer.dispose();
  };

  return { resize, dispose };
}
