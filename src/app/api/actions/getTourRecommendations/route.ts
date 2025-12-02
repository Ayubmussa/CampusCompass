'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getTourRecommendationsAction, type TourRecommendationState } from '@/app/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const interests: string | undefined = body?.interests;

    const form = new FormData();
    if (interests) form.set('interests', interests);

    const initial: TourRecommendationState = { recommendations: null, error: null };
    const result = await getTourRecommendationsAction(initial, form);
    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}


