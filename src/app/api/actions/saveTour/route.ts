'use server';

import { NextRequest, NextResponse } from 'next/server';
import { saveTourAction } from '@/app/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, locationIds, userId } = body || {};
    if (!name || !description || !Array.isArray(locationIds) || !userId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const result = await saveTourAction({ name, description, locationIds, userId });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}


