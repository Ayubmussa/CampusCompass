'use server';

import { NextRequest, NextResponse } from 'next/server';
import { addReviewAction } from '@/app/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationId, rating, comment, userId, displayName } = body || {};
    if (!locationId || typeof rating !== 'number' || !userId || !displayName) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
    const result = await addReviewAction({ locationId, rating, comment: comment ?? '', userId, displayName });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}


