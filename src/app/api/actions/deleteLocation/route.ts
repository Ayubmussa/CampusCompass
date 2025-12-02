'use server';

import { NextRequest, NextResponse } from 'next/server';
import { deleteLocationAction } from '@/app/actions';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const locationId: string | undefined = body?.locationId ?? body?.id;
    if (!locationId) {
      return NextResponse.json({ success: false, error: 'Missing locationId' }, { status: 400 });
    }
    const result = await deleteLocationAction(locationId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}


