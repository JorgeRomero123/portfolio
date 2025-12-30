import { getToursData } from '@/lib/content';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getToursData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ tours: [] }, { status: 200 });
  }
}
