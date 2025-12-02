'use server';

import { NextRequest, NextResponse } from 'next/server';
import { updateLocationAction } from '@/app/actions';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }
    const payload = {
      id,
      name: body.name,
      description: body.description,
      panoramaUrl: body.panoramaUrl ?? body['panorama_url'],
      thumbnailUrl: body.thumbnailUrl ?? body['thumbnail_url'],
      coordinates: body.coordinates,
      connections: body.connections,
    };
    const result = await updateLocationAction(payload);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}


