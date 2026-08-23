import type { QuehacerCalculado } from '@/lib/quehaceres';
import type { DatosQuehacer } from './FormaQuehacer';

/**
 * Lo que se puede hacer con un quehacer, en un solo objeto.
 *
 * El dueño de los datos (QuehaceresTracker) las implementa una vez y la lista y
 * el mapa las reciben igual; una vista nueva sobre los mismos quehaceres solo
 * tiene que aceptar esto.
 */
export type Acciones = {
  /** Id del quehacer con una petición en vuelo, para deshabilitar su botón. */
  ocupado: string | null;
  /** Id del quehacer abierto en modo edición. */
  editando: string | null;
  onHecho: (q: QuehacerCalculado) => void;
  onEditar: (id: string | null) => void;
  onGuardar: (id: string, datos: Partial<DatosQuehacer>) => void;
  onArchivar: (id: string) => void;
  onReiniciar: (id: string) => void;
  onCrear: (datos: DatosQuehacer) => Promise<boolean>;
};
