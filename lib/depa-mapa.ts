/**
 * El depa como datos: cuartos, muebles y por dónde se camina.
 *
 * Aquí no hay React ni nada de quehaceres. Es la planta del departamento y ya,
 * para que más de una herramienta pueda dibujar el mismo depa: hoy los
 * quehaceres le pintan burbujas encima, mañana la rutina le puede desbloquear
 * muebles con el campo `nivel`.
 *
 * Agregar un cuarto = una entrada en ZONAS (con su ruta desde el HUB).
 * Agregar un mueble = una entrada en MUEBLES + su arte en arte-muebles.tsx.
 * Los tipos ZonaId y MuebleId se derivan solos de esos arreglos.
 *
 * Sistema de coordenadas: viewBox "0 0 400 300", el mismo que usa PlanoDepa.
 */

export type Punto = { x: number; y: number };

/**
 * Cómo se ve un mueble. Es el semáforo del plano y el vocabulario compartido:
 * quien quiera dibujar sobre este depa manda muebles en uno de estos tres
 * estados, sepa o no qué es un quehacer.
 */
export type Suciedad = 'limpio' | 'sucio' | 'mugroso';

/**
 * Una burbuja parada sobre un mueble. PlanoDepa no sabe de dónde salen: solo
 * las dibuja. Esa es la costura para que otra herramienta use el mismo plano.
 */
export type Marcador = {
  mueble: string;
  suciedad: Suciedad;
  /** Lo que se lee en la burbuja al acercarse. */
  etiqueta: string;
  /** Cuántas cosas agrupa esta burbuja. */
  conteo: number;
};

export type Zona = {
  id: string;
  nombre: string;
  /** Para la lista y el correo, donde no hay plano que ver. */
  emoji: string;
  /** Rectángulo del cuarto. Se nombra como en SVG para poder hacerle spread. */
  caja: { x: number; y: number; width: number; height: number };
  /** Nombre para el plano, cuando el largo no cabe. */
  nombreCorto?: string;
  /** Dónde se para el monito cuando llega. */
  centro: Punto;
  /**
   * Camino desde el HUB hasta el centro del cuarto. El último punto es el
   * centro. Tener la ruta como dato es lo que evita un pathfinder: un cuarto
   * nuevo solo declara por dónde se llega a él.
   */
  ruta: Punto[];
};

/** El nodo de circulación del depa: la mitad del pasillo. */
export const HUB: Punto = { x: 164, y: 150 };

export const ZONAS = [
  {
    id: 'recamara2',
    nombre: 'Recámara 2',
    emoji: '🖥️',
    caja: { x: 0, y: 0, width: 150, height: 100 },
    centro: { x: 75, y: 62 },
    ruta: [
      { x: 164, y: 55 },
      { x: 75, y: 62 },
    ],
  },
  {
    id: 'recamara1',
    nombre: 'Recámara 1',
    emoji: '🛏️',
    caja: { x: 0, y: 100, width: 150, height: 100 },
    centro: { x: 112, y: 172 },
    ruta: [
      { x: 164, y: 150 },
      { x: 112, y: 172 },
    ],
  },
  {
    id: 'bano',
    nombre: 'Baño',
    emoji: '🚿',
    caja: { x: 0, y: 200, width: 150, height: 100 },
    centro: { x: 70, y: 252 },
    ruta: [
      { x: 164, y: 250 },
      { x: 70, y: 252 },
    ],
  },
  {
    id: 'pasillo',
    nombre: 'Todo el depa',
    nombreCorto: 'Pasillo',
    emoji: '🧹',
    caja: { x: 150, y: 0, width: 28, height: 300 },
    centro: { x: 164, y: 150 },
    ruta: [{ x: 164, y: 150 }],
  },
  {
    id: 'sala',
    nombre: 'Sala-comedor',
    emoji: '🛋️',
    caja: { x: 178, y: 0, width: 222, height: 190 },
    centro: { x: 285, y: 108 },
    ruta: [
      { x: 164, y: 95 },
      { x: 285, y: 108 },
    ],
  },
  {
    id: 'cocina',
    nombre: 'Cocina',
    emoji: '🔥',
    caja: { x: 178, y: 190, width: 122, height: 110 },
    centro: { x: 238, y: 252 },
    ruta: [
      { x: 164, y: 248 },
      { x: 238, y: 252 },
    ],
  },
  {
    id: 'lavado',
    nombre: 'Lavado y boiler',
    emoji: '🧺',
    caja: { x: 300, y: 190, width: 100, height: 110 },
    centro: { x: 350, y: 256 },
    // Al lavadero se entra pasando por la cocina; por eso lleva un punto extra.
    ruta: [
      { x: 164, y: 248 },
      { x: 250, y: 264 },
      { x: 350, y: 256 },
    ],
  },
] as const satisfies readonly Zona[];

export type ZonaId = (typeof ZONAS)[number]['id'];

export type Mueble = {
  id: string;
  zona: ZonaId;
  /** Como se llama en el selector al editar un quehacer. */
  nombre: string;
  /** Centro del mueble en el plano. */
  x: number;
  y: number;
  /**
   * Cuánto sube la burbuja respecto al mueble. Se ajusta cuando el default
   * chocaría con la pared de arriba o con otro mueble.
   */
  burbujaDy?: number;
  /**
   * Nivel en el que se desbloquea. Sin usar todavía: es la costura para que la
   * rutina pueda ganarse muebles sobre este mismo plano sin rehacer nada.
   */
  nivel?: number;
};

export const MUEBLES = [
  // recámara 2 — el cuarto de trabajo
  { id: 'escritorio', zona: 'recamara2', nombre: 'El escritorio', x: 52, y: 44 },
  { id: 'laptop', zona: 'recamara2', nombre: 'La laptop', x: 103, y: 40, burbujaDy: -14 },
  { id: 'silla', zona: 'recamara2', nombre: 'La silla', x: 74, y: 76 },

  // recámara 1 — la principal
  { id: 'cama', zona: 'recamara1', nombre: 'La cama', x: 58, y: 148 },
  { id: 'buro', zona: 'recamara1', nombre: 'El buró', x: 122, y: 122, burbujaDy: -14 },

  // baño
  { id: 'regadera', zona: 'bano', nombre: 'La regadera', x: 30, y: 238 },
  { id: 'lavabo', zona: 'bano', nombre: 'El lavabo', x: 112, y: 232 },
  { id: 'botiquin', zona: 'bano', nombre: 'El botiquín', x: 68, y: 216, burbujaDy: -12 },
  { id: 'taza', zona: 'bano', nombre: 'El escusado', x: 112, y: 278 },

  // pasillo — lo que no es de un solo cuarto
  { id: 'piso', zona: 'pasillo', nombre: 'El piso del depa', x: 164, y: 218 },

  // sala-comedor
  { id: 'sillon', zona: 'sala', nombre: 'El sillón', x: 248, y: 130 },
  { id: 'mesa', zona: 'sala', nombre: 'La mesa', x: 340, y: 58 },
  { id: 'tele', zona: 'sala', nombre: 'La tele', x: 200, y: 78 },
  { id: 'planta', zona: 'sala', nombre: 'Las plantas', x: 376, y: 152 },

  // cocina
  { id: 'estufa', zona: 'cocina', nombre: 'La estufa', x: 206, y: 214 },
  { id: 'fregadero', zona: 'cocina', nombre: 'El fregadero', x: 248, y: 212 },
  { id: 'refri', zona: 'cocina', nombre: 'El refri', x: 284, y: 222 },
  { id: 'cafetera', zona: 'cocina', nombre: 'La cafetera', x: 196, y: 262 },
  { id: 'bote', zona: 'cocina', nombre: 'El bote de basura', x: 280, y: 282 },

  // lavado y boiler
  { id: 'lavadora', zona: 'lavado', nombre: 'La lavadora', x: 328, y: 230 },
  { id: 'boiler', zona: 'lavado', nombre: 'El boiler', x: 376, y: 214 },
  { id: 'tendedero', zona: 'lavado', nombre: 'El tendedero', x: 350, y: 268 },
] as const satisfies readonly Mueble[];

export type MuebleId = (typeof MUEBLES)[number]['id'];

// ------------------------------------------------------------------ helpers

// Se tipan con los elementos literales de los arreglos, no con Zona/Mueble, para
// que `zona('cocina').id` siga siendo ZonaId y no un string cualquiera.
type ZonaDef = (typeof ZONAS)[number];
type MuebleDef = (typeof MUEBLES)[number];

const PORID_ZONA: Map<string, ZonaDef> = new Map(ZONAS.map((z) => [z.id, z]));
const PORID_MUEBLE: Map<string, MuebleDef> = new Map(MUEBLES.map((m) => [m.id, m]));

/** El cuarto donde cae lo que no tiene cuarto. */
export const ZONA_POR_DEFECTO: ZonaId = 'pasillo';

export function zona(id: string | null | undefined): ZonaDef {
  return PORID_ZONA.get(id ?? '') ?? PORID_ZONA.get(ZONA_POR_DEFECTO)!;
}

export function mueble(id: string | null | undefined): MuebleDef | null {
  return PORID_MUEBLE.get(id ?? '') ?? null;
}

export function esZonaId(v: unknown): v is ZonaId {
  return typeof v === 'string' && PORID_ZONA.has(v);
}

export function esMuebleId(v: unknown): v is MuebleId {
  return typeof v === 'string' && PORID_MUEBLE.has(v);
}

/** Cómo se rotula el cuarto en el plano, donde no siempre cabe el nombre largo. */
export function nombreEnPlano(z: ZonaDef): string {
  return 'nombreCorto' in z && z.nombreCorto ? z.nombreCorto : z.nombre;
}

export function mueblesDeZona(id: ZonaId): MuebleDef[] {
  return MUEBLES.filter((m) => m.zona === id);
}

/** Dónde va la burbuja de un mueble. */
export function anclaBurbuja(m: Mueble): Punto {
  return { x: m.x, y: m.y + (m.burbujaDy ?? -20) };
}

function mismoPunto(a: Punto, b: Punto): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Los puntos por los que pasa el monito para ir de un cuarto a otro: sale al
 * pasillo deshaciendo su ruta, cruza el HUB y entra por la ruta del destino.
 */
export function rutaEntre(origen: ZonaId, destino: ZonaId): Punto[] {
  if (origen === destino) return [];

  const salida = [...zona(origen).ruta].reverse().slice(1); // ya está en su centro
  const camino = [...salida, HUB, ...zona(destino).ruta];

  return camino.filter((p, i) => i === 0 || !mismoPunto(p, camino[i - 1]));
}

/**
 * Lee zona y punto del cuerpo de una petición.
 *
 * Un mueble que no pertenece a la zona que mandaron es un error del cliente,
 * no algo que se deba guardar: la burbuja acabaría flotando en otro cuarto.
 */
export function leerUbicacion(body: Record<string, unknown>): {
  zona?: ZonaId;
  punto?: string | null;
  error?: string;
} {
  const out: { zona?: ZonaId; punto?: string | null } = {};

  if (body.zona !== undefined) {
    if (!esZonaId(body.zona)) return { error: 'Ese cuarto no existe en el depa.' };
    out.zona = body.zona;
  }

  if (body.punto !== undefined) {
    if (body.punto === null || body.punto === '') {
      out.punto = null;
    } else if (!esMuebleId(body.punto)) {
      return { error: 'Ese mueble no existe en el depa.' };
    } else {
      out.punto = body.punto;
    }
  }

  if (out.zona && out.punto && mueble(out.punto)!.zona !== out.zona) {
    return { error: 'Ese mueble no está en ese cuarto.' };
  }

  return out;
}
