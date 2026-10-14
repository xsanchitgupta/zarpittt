import { NextResponse } from 'next/server';
import { getServiceAreas } from '@/lib/data';

export async function GET() {
  try {
    const areas = await getServiceAreas();
    return NextResponse.json({ data: areas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
