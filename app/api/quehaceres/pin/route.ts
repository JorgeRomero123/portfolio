import { NextRequest, NextResponse } from 'next/server';
import {
  abrirSesion,
  cerrarSesion,
  pinConfigurado,
  pinCorrecto,
  sesionValida,
} from '@/lib/quehaceres-auth';

// GET → ¿la sesión actual sigue siendo válida?
export async function GET() {
  if (!pinConfigurado()) {
    return NextResponse.json({ autorizado: false, sinConfigurar: true });
  }
  return NextResponse.json({ autorizado: await sesionValida(), sinConfigurar: false });
}

// POST → intenta abrir sesión con un PIN.
export async function POST(req: NextRequest) {
  if (!pinConfigurado()) {
    return NextResponse.json(
      { error: 'Falta configurar QUEHACERES_PIN en el entorno.' },
      { status: 503 }
    );
  }

  const { pin } = (await req.json().catch(() => ({}))) as { pin?: unknown };
  if (typeof pin !== 'string' || !pin) {
    return NextResponse.json({ error: 'PIN inválido.' }, { status: 400 });
  }

  if (!pinCorrecto(pin)) {
    return NextResponse.json({ error: 'PIN incorrecto.' }, { status: 401 });
  }

  await abrirSesion(pin);
  return NextResponse.json({ autorizado: true });
}

// DELETE → cerrar sesión.
export async function DELETE() {
  await cerrarSesion();
  return NextResponse.json({ autorizado: false });
}
