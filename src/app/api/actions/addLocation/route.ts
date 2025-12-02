'use server';

import { NextRequest, NextResponse } from 'next/server';
import { addLocationAction } from '@/app/actions';
import type { Location } from '@/lib/locations';

type Payload = Omit<Location, 'id'>;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Payload>;
    const b: any = body;
    if (!body?.name || !body?.description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const payload: Payload = {
      name: body.name,
      description: body.description,
      panoramaUrl: body.panoramaUrl ?? b['panorama_url'] ?? '',
      thumbnailUrl: body.thumbnailUrl ?? b['thumbnail_url'] ?? '',
      coordinates: body.coordinates ?? { lat: 0, lng: 0 },
      connections: body.connections ?? [],
    };
    const result = await addLocationAction(payload);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}


